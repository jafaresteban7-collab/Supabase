import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Client } from '../models/client.model';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  // Señales: guardan el usuario y su rol, y la pantalla se actualiza sola
  public currentUser = signal<User | null>(null);
  public userRole = signal<'admin' | 'user' | null>(null);

  // Promesa que indica que ya se ha comprobado si había sesión abierta
  public ready: Promise<void>;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    this.ready = this.initSession();
  }

  // --- AUTENTICACIÓN Y ROLES ---
  private async initSession() {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (session?.user) {
      this.currentUser.set(session.user);
      await this.loadRole(session.user.id);
    }
  }

  async login(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) {
      this.currentUser.set(data.user);
      await this.loadRole(data.user.id);
    }
  }

  async logout() {
    await this.supabase.auth.signOut();
    this.currentUser.set(null);
    this.userRole.set(null);
  }

  private async loadRole(userId: string) {
    const { data, error } = await this.supabase
      .from('profiles').select('role').eq('id', userId).single();
    if (!error && data) {
      this.userRole.set(data.role);
    }
  }

  // --- CRUD CLIENTES ---
  async getClients(): Promise<Client[]> {
    const { data, error } = await this.supabase
      .from('clients').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async createClient(client: Client): Promise<void> {
    const { error } = await this.supabase.from('clients').insert([{
      nombre: client.nombre, empresa: client.empresa, email: client.email
    }]);
    if (error) throw error;
  }

  async updateClient(id: string, client: Partial<Client>): Promise<void> {
    const { error } = await this.supabase.from('clients').update(client).eq('id', id);
    if (error) throw error;
  }

  async deleteClient(id: string): Promise<void> {
    const { error } = await this.supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
  }
    // --- STORAGE: imágenes del bucket ---
  async getImages(): Promise<{ name: string; url: string }[]> {
    const { data, error } = await this.supabase.storage
      .from('galeria')
      .list('', { limit: 100, sortBy: { column: 'name', order: 'asc' } });
    if (error) throw error;

    // Quitamos carpetas y el archivo de relleno que crea Supabase
    return (data || [])
      .filter(f => !!f.id && f.name !== '.emptyFolderPlaceholder')
      .map(f => ({
        name: f.name,
        url: this.supabase.storage.from('galeria').getPublicUrl(f.name).data.publicUrl
      }));
  }
}