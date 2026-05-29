export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          avatar_url: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          username?: string | null
          avatar_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      boards: {
        Row: {
          id: string
          user_id: string
          title: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          created_at?: string
        }
        Relationships: []
      }
      columns: {
        Row: {
          id: string
          board_id: string
          title: string
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          board_id: string
          title: string
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          board_id?: string
          title?: string
          position?: number
          created_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          id: string
          column_id: string
          title: string
          description: string | null
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          column_id: string
          title: string
          description?: string | null
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          column_id?: string
          title?: string
          description?: string | null
          position?: number
          created_at?: string
        }
        Relationships: []
      }
      task_attachments: {
        Row: {
          id: string
          task_id: string
          file_url: string
          file_name: string
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          file_url: string
          file_name: string
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          file_url?: string
          file_name?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}