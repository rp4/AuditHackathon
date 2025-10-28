// Database types generated from schema.sql
// This will be replaced by auto-generated types when Supabase is running

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string | null
          bio: string | null
          avatar_url: string | null
          website: string | null
          github_url: string | null
          linkedin_url: string | null
          reputation_score: number
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          website?: string | null
          github_url?: string | null
          linkedin_url?: string | null
          reputation_score?: number
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          website?: string | null
          github_url?: string | null
          linkedin_url?: string | null
          reputation_score?: number
          is_verified?: boolean
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
          parent_id: string | null
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          icon?: string | null
          parent_id?: string | null
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          icon?: string | null
          parent_id?: string | null
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
          icon: string | null
          documentation_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          icon?: string | null
          documentation_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          icon?: string | null
          documentation_url?: string | null
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
          instructions: any
          configuration: any
          sample_inputs: any
          sample_outputs: any
          prerequisites: string[] | null
          documentation_preview: any | null
          documentation_full: any | null
          documentation_preview_images: string[] | null
          documentation_full_images: string[] | null
          is_premium: boolean
          price: number
          currency: string
          preview_paragraph_count: number
          version: string
          is_public: boolean
          is_featured: boolean
          complexity_level: 'beginner' | 'intermediate' | 'advanced' | null
          estimated_tokens: number | null
          estimated_cost: number | null
          tags: string[] | null
          favorites_count: number
          downloads_count: number
          views_count: number
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
          instructions?: any
          configuration?: any
          sample_inputs?: any
          sample_outputs?: any
          prerequisites?: string[] | null
          documentation_preview?: any | null
          documentation_full?: any | null
          documentation_preview_images?: string[] | null
          documentation_full_images?: string[] | null
          is_premium?: boolean
          price?: number
          currency?: string
          preview_paragraph_count?: number
          version?: string
          is_public?: boolean
          is_featured?: boolean
          complexity_level?: 'beginner' | 'intermediate' | 'advanced' | null
          estimated_tokens?: number | null
          estimated_cost?: number | null
          tags?: string[] | null
          favorites_count?: number
          downloads_count?: number
          views_count?: number
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
          instructions?: any
          configuration?: any
          sample_inputs?: any
          sample_outputs?: any
          prerequisites?: string[] | null
          documentation_preview?: any | null
          documentation_full?: any | null
          documentation_preview_images?: string[] | null
          documentation_full_images?: string[] | null
          is_premium?: boolean
          price?: number
          currency?: string
          preview_paragraph_count?: number
          version?: string
          is_public?: boolean
          is_featured?: boolean
          complexity_level?: 'beginner' | 'intermediate' | 'advanced' | null
          estimated_tokens?: number | null
          estimated_cost?: number | null
          tags?: string[] | null
          favorites_count?: number
          downloads_count?: number
          views_count?: number
          avg_rating?: number
          total_ratings?: number
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
      }
      agent_platforms: {
        Row: {
          agent_id: string
          platform_id: string
          platform_config: any
        }
        Insert: {
          agent_id: string
          platform_id: string
          platform_config?: any
        }
        Update: {
          agent_id?: string
          platform_id?: string
          platform_config?: any
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
          is_verified_purchase: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          agent_id: string
          score: number
          review?: string | null
          is_verified_purchase?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          agent_id?: string
          score?: number
          review?: string | null
          is_verified_purchase?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      downloads: {
        Row: {
          id: string
          user_id: string | null
          agent_id: string
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          agent_id: string
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          agent_id?: string
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          user_id: string
          agent_id: string
          parent_id: string | null
          content: string
          is_edited: boolean
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
          is_edited?: boolean
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
          is_edited?: boolean
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      collections: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          slug: string
          is_public: boolean
          is_featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          slug: string
          is_public?: boolean
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          slug?: string
          is_public?: boolean
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      collection_agents: {
        Row: {
          collection_id: string
          agent_id: string
          added_at: string
          notes: string | null
        }
        Insert: {
          collection_id: string
          agent_id: string
          added_at?: string
          notes?: string | null
        }
        Update: {
          collection_id?: string
          agent_id?: string
          added_at?: string
          notes?: string | null
        }
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string | null
          data: any
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message?: string | null
          data?: any
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string | null
          data?: any
          is_read?: boolean
          created_at?: string
        }
      }
      agent_versions: {
        Row: {
          id: string
          agent_id: string
          version: string
          change_notes: string | null
          configuration: any
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          version: string
          change_notes?: string | null
          configuration?: any
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          version?: string
          change_notes?: string | null
          configuration?: any
          created_by?: string | null
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      increment_agent_views: {
        Args: { p_agent_id: string }
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
    Enums: Record<string, never>
  }
}

// Helper types for easier usage
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Platform = Database['public']['Tables']['platforms']['Row']
export type Agent = Database['public']['Tables']['agents']['Row']
export type AgentPlatform = Database['public']['Tables']['agent_platforms']['Row']
export type Favorite = Database['public']['Tables']['favorites']['Row']
export type Rating = Database['public']['Tables']['ratings']['Row']
export type Download = Database['public']['Tables']['downloads']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']
export type Collection = Database['public']['Tables']['collections']['Row']
export type CollectionAgent = Database['public']['Tables']['collection_agents']['Row']
export type Follow = Database['public']['Tables']['follows']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type AgentVersion = Database['public']['Tables']['agent_versions']['Row']

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type AgentInsert = Database['public']['Tables']['agents']['Insert']
export type FavoriteInsert = Database['public']['Tables']['favorites']['Insert']
export type RatingInsert = Database['public']['Tables']['ratings']['Insert']
export type CommentInsert = Database['public']['Tables']['comments']['Insert']
export type DownloadInsert = Database['public']['Tables']['downloads']['Insert']

// Update types
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type AgentUpdate = Database['public']['Tables']['agents']['Update']
export type RatingUpdate = Database['public']['Tables']['ratings']['Update']
export type CommentUpdate = Database['public']['Tables']['comments']['Update']

// Extended types with relations
export type AgentWithRelations = Agent & {
  profile: Profile
  category: Category | null
  agent_platforms: (AgentPlatform & { platform: Platform })[]
  user_favorited?: boolean
  user_rating?: number | null
}

export type CommentWithProfile = Comment & {
  profile: Profile
  replies?: CommentWithProfile[]
}

export type RatingWithProfile = Rating & {
  profile: Profile
}
