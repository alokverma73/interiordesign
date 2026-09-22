export interface Service {
  id: string;
  name: string;
  slug: string;
  short_description?: string;
  description?: string;
  cover_image_url?: string;
  gallery: string[];
  features: string[];
  process_steps: { title: string; description: string }[];
  faqs: { question: string; answer: string }[];
  cta_label?: string;
  seo_title?: string;
  seo_description?: string;
  is_active: boolean;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  category: string;
  location?: string;
  client_type?: string;
  completion_date?: string;
  area_sqft?: number;
  description?: string;
  design_concept?: string;
  materials_used: string[];
  cover_image_url?: string;
  gallery: string[];
  before_after_images: { before: string; after: string; label?: string }[];
  is_featured: boolean;
  is_published: boolean;
  status: string;
  seo_title?: string;
  seo_description?: string;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  description?: string;
  status: string;
  is_completed: boolean;
  completed_at?: string;
  due_date?: string;
}

export interface ProjectPortal extends Project {
  start_date?: string;
  expected_completion_date?: string;
  milestones: ProjectMilestone[];
}

export interface Testimonial {
  id: string;
  client_name: string;
  client_location?: string;
  client_photo_url?: string;
  rating: number;
  content: string;
  is_published: boolean;
  is_featured: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featured_image_url?: string;
  is_published: boolean;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface Enquiry {
  id: string;
  enquiry_number: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}
