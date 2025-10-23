// Auto-generated types based on supabase/schema.sql
// This file should be regenerated when schema changes using:
// npx supabase gen types typescript --project-id <your-project-id> > src/types/database-generated.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          bio: string | null
          avatar_url: string | null
          website: string | null
          github_url: string | null
          linkedin_url: string | null
          reputation_score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          website?: string | null
          github_url?: string | null
          linkedin_url?: string | null
          reputation_score?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          website?: string | null
          github_url?: string | null
          linkedin_url?: string | null
          reputation_score?: number
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          icon: string | null
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          icon?: string | null
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          icon?: string | null
          order_index?: number
          created_at?: string
        }
      }
      platforms: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          icon_url: string | null
          website_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          icon_url?: string | null
          website_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          icon_url?: string | null
          website_url?: string | null
          created_at?: string
        }
      }
      agents: {
        Row: {
          id: string
          user_id: string
          name: string
          slug: string
          description: string
          category_id: string | null
          markdown_content: string | null
          instructions: Json | null
          configuration: Json | null
          sample_inputs: Json | null
          sample_outputs: Json | null
          tags: string[] | null
          version: string
          complexity_level: 'beginner' | 'intermediate' | 'advanced' | null
          prerequisites: string[] | null
          estimated_tokens: number | null
          estimated_cost: number | null
          is_public: boolean
          views_count: number
          downloads_count: number
          favorites_count: number
          avg_rating: number
          total_ratings: number
          created_at: string
          updated_at: string
          published_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          slug: string
          description: string
          category_id?: string | null
          markdown_content?: string | null
          instructions?: Json | null
          configuration?: Json | null
          sample_inputs?: Json | null
          sample_outputs?: Json | null
          tags?: string[] | null
          version?: string
          complexity_level?: 'beginner' | 'intermediate' | 'advanced' | null
          prerequisites?: string[] | null
          estimated_tokens?: number | null
          estimated_cost?: number | null
          is_public?: boolean
          views_count?: number
          downloads_count?: number
          favorites_count?: number
          avg_rating?: number
          total_ratings?: number
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          slug?: string
          description?: string
          category_id?: string | null
          markdown_content?: string | null
          instructions?: Json | null
          configuration?: Json | null
          sample_inputs?: Json | null
          sample_outputs?: Json | null
          tags?: string[] | null
          version?: string
          complexity_level?: 'beginner' | 'intermediate' | 'advanced' | null
          prerequisites?: string[] | null
          estimated_tokens?: number | null
          estimated_cost?: number | null
          is_public?: boolean
          views_count?: number
          downloads_count?: number
          favorites_count?: number
          avg_rating?: number
          total_ratings?: number
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          agent_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          agent_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          agent_id?: string
          created_at?: string
        }
      }
      ratings: {
        Row: {
          id: string
          user_id: string
          agent_id: string
          score: number
          review: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          agent_id: string
          score: number
          review?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          agent_id?: string
          score?: number
          review?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          user_id: string
          agent_id: string
          parent_id: string | null
          content: string
          is_deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          agent_id: string
          parent_id?: string | null
          content: string
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          agent_id?: string
          parent_id?: string | null
          content?: string
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      downloads: {
        Row: {
          id: string
          user_id: string | null
          agent_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          agent_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          agent_id?: string
          created_at?: string
        }
      }
      agent_platforms: {
        Row: {
          id: string
          agent_id: string
          platform_id: string
          created_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          platform_id: string
          created_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          platform_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_agent_views: {
        Args: { agent_id: string }
        Returns: void
      }
      has_user_favorited: {
        Args: { p_agent_id: string; p_user_id: string }
        Returns: boolean
      }
      get_user_rating: {
        Args: { p_agent_id: string; p_user_id: string }
        Returns: number | null
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Specific table types
export type Profile = Tables<'profiles'>
export type ProfileInsert = Inserts<'profiles'>
export type ProfileUpdate = Updates<'profiles'>

export type Category = Tables<'categories'>
export type CategoryInsert = Inserts<'categories'>

export type Platform = Tables<'platforms'>
export type PlatformInsert = Inserts<'platforms'>

export type Agent = Tables<'agents'>
export type AgentInsert = Inserts<'agents'>
export type AgentUpdate = Updates<'agents'>

export type Favorite = Tables<'favorites'>
export type FavoriteInsert = Inserts<'favorites'>

export type Rating = Tables<'ratings'>
export type RatingInsert = Inserts<'ratings'>
export type RatingUpdate = Updates<'ratings'>

export type Comment = Tables<'comments'>
export type CommentInsert = Inserts<'comments'>
export type CommentUpdate = Updates<'comments'>

export type Download = Tables<'downloads'>
export type DownloadInsert = Inserts<'downloads'>

export type AgentPlatform = Tables<'agent_platforms'>
export type AgentPlatformInsert = Inserts<'agent_platforms'>
