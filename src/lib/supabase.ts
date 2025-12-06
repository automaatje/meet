import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { triggerWebhooks } from './webhooks/trigger';
import { WEBHOOK_EVENTS, EventPayloads } from './webhooks/events';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

async function getCurrentOrganizationId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('team_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  return data?.organization_id || null;
}

type Customer = Database['public']['Tables']['customers']['Row'];
type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
type CustomerUpdate = Database['public']['Tables']['customers']['Update'];

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

export const customerService = {
  async getAll() {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getWithProjectCount(id: string) {
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (customerError) throw customerError;
    if (!customer) return null;

    const { count, error: countError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', id);

    if (countError) throw countError;

    return { ...customer, project_count: count || 0 };
  },

  async getAllWithProjectCounts() {
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (customersError) throw customersError;
    if (!customers) return [];

    const customersWithCounts = await Promise.all(
      customers.map(async (customer) => {
        const { count } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('customer_id', customer.id);

        return { ...customer, project_count: count || 0 };
      })
    );

    return customersWithCounts;
  },

  async create(customer: Omit<CustomerInsert, 'user_id' | 'organization_id'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const organizationId = await getCurrentOrganizationId();
    if (!organizationId) throw new Error('No organization found');

    const { data, error } = await supabase
      .from('customers')
      .insert({ ...customer, user_id: user.id, organization_id: organizationId })
      .select()
      .single();

    if (error) throw error;

    if (data) {
      await triggerWebhooks(
        user.id,
        WEBHOOK_EVENTS.CUSTOMER_CREATED,
        EventPayloads[WEBHOOK_EVENTS.CUSTOMER_CREATED](data)
      );
    }

    return data;
  },

  async update(id: string, updates: CustomerUpdate) {
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getProjects(customerId: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};

export const projectService = {
  async getAll() {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        customer:customers(company_name, contact_name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        customer:customers(id, company_name, contact_name, email, phone)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create(project: Omit<ProjectInsert, 'user_id' | 'organization_id'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const organizationId = await getCurrentOrganizationId();
    if (!organizationId) throw new Error('No organization found');

    const quoteNumber = `OFF-${Date.now().toString().slice(-8)}`;

    const { data, error } = await supabase
      .from('projects')
      .insert({
        ...project,
        user_id: user.id,
        organization_id: organizationId,
        quote_number: quoteNumber,
      })
      .select(`
        *,
        customer:customers(id, company_name, contact_name, email, phone)
      `)
      .single();

    if (error) throw error;

    if (data && data.customer) {
      await triggerWebhooks(
        user.id,
        WEBHOOK_EVENTS.PROJECT_CREATED,
        EventPayloads[WEBHOOK_EVENTS.PROJECT_CREATED](data, data.customer)
      );
    }

    return data;
  },

  async update(id: string, updates: ProjectUpdate) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const originalProject = await this.getById(id);

    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        customer:customers(id, company_name, contact_name, email, phone)
      `)
      .single();

    if (error) throw error;

    if (data && data.customer) {
      if (originalProject?.status !== 'won' && updates.status === 'won') {
        await triggerWebhooks(
          user.id,
          WEBHOOK_EVENTS.PROJECT_WON,
          EventPayloads[WEBHOOK_EVENTS.PROJECT_WON](data, data.customer)
        );
      }

      if (updates.status === 'quote_sent') {
        await triggerWebhooks(
          user.id,
          WEBHOOK_EVENTS.QUOTE_SENT,
          EventPayloads[WEBHOOK_EVENTS.QUOTE_SENT](data, data.customer)
        );
      }
    }

    return data;
  },

  async updateStatus(id: string, status: 'draft' | 'sent' | 'accepted' | 'rejected') {
    return this.update(id, { status });
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getMeasurements(projectId: string) {
    const { data, error } = await supabase
      .from('measurements')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getPhotos(projectId: string) {
    const { data, error } = await supabase
      .from('project_photos')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};

export const photoService = {
  async uploadPhoto(
    file: File,
    projectId: string,
    caption?: string,
    photoType: 'before' | 'after' | 'detail' = 'detail'
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${user.id}/${projectId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('project-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('project-photos')
      .getPublicUrl(filePath);

    const { data, error } = await supabase
      .from('project_photos')
      .insert({
        project_id: projectId,
        photo_url: publicUrl,
        caption: caption || '',
        photo_type: photoType
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletePhoto(photoId: string, photoUrl: string) {
    const urlParts = photoUrl.split('/');
    const filePath = urlParts.slice(-3).join('/');

    const { error: storageError } = await supabase.storage
      .from('project-photos')
      .remove([filePath]);

    if (storageError) throw storageError;

    const { error } = await supabase
      .from('project_photos')
      .delete()
      .eq('id', photoId);

    if (error) throw error;
  },

  getPhotoUrl(filePath: string) {
    const { data } = supabase.storage
      .from('project-photos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }
};

type MeasurementInsert = Database['public']['Tables']['measurements']['Insert'];

export const pricingService = {
  async getTemplates() {
    const { data, error } = await supabase
      .from('price_templates')
      .select('*')
      .order('is_default', { ascending: false })
      .order('name');

    if (error) throw error;
    return data;
  },

  async getDefaultTemplate() {
    const { data, error } = await supabase
      .from('price_templates')
      .select('*')
      .eq('is_default', true)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createTemplate(template: {
    name: string;
    material_price_m2: number;
    labor_price_m2: number;
    waste_percentage: number;
    vat_percentage: number;
    is_default?: boolean;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    if (template.is_default) {
      await supabase
        .from('price_templates')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    const { data, error } = await supabase
      .from('price_templates')
      .insert({
        ...template,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTemplate(id: string, updates: {
    name?: string;
    material_price_m2?: number;
    labor_price_m2?: number;
    waste_percentage?: number;
    vat_percentage?: number;
    is_default?: boolean;
  }) {
    if (updates.is_default) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await supabase
        .from('price_templates')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    const { data, error } = await supabase
      .from('price_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTemplate(id: string) {
    const { error } = await supabase
      .from('price_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getLineItems(projectId: string) {
    const { data, error } = await supabase
      .from('quote_line_items')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order');

    if (error) throw error;
    return data;
  },

  async createLineItem(lineItem: {
    project_id: string;
    description: string;
    area_m2: number;
    template_id?: string;
    material_price_m2: number;
    labor_price_m2: number;
    waste_percentage: number;
    vat_percentage: number;
    sort_order: number;
  }) {
    const { data, error } = await supabase
      .from('quote_line_items')
      .insert(lineItem)
      .select()
      .single();

    if (error) throw error;

    await this.updateProjectTotalPrice(lineItem.project_id);

    return data;
  },

  async updateLineItem(id: string, updates: {
    description?: string;
    area_m2?: number;
    template_id?: string;
    material_price_m2?: number;
    labor_price_m2?: number;
    waste_percentage?: number;
    vat_percentage?: number;
    sort_order?: number;
  }) {
    const { data: lineItem, error: fetchError } = await supabase
      .from('quote_line_items')
      .select('project_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    const { data, error } = await supabase
      .from('quote_line_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (lineItem) {
      await this.updateProjectTotalPrice(lineItem.project_id);
    }

    return data;
  },

  async deleteLineItem(id: string) {
    const { data: lineItem, error: fetchError } = await supabase
      .from('quote_line_items')
      .select('project_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    const { error } = await supabase
      .from('quote_line_items')
      .delete()
      .eq('id', id);

    if (error) throw error;

    if (lineItem) {
      await this.updateProjectTotalPrice(lineItem.project_id);
    }
  },

  async updateProjectTotalPrice(projectId: string) {
    const { data: lineItems, error: lineItemsError } = await supabase
      .from('quote_line_items')
      .select('*')
      .eq('project_id', projectId);

    if (lineItemsError) throw lineItemsError;

    let totalPrice = 0;

    lineItems?.forEach(item => {
      const materialCost = item.area_m2 * item.material_price_m2 * (1 + item.waste_percentage / 100);
      const laborCost = item.area_m2 * item.labor_price_m2;
      const subtotal = materialCost + laborCost;
      const vat = subtotal * (item.vat_percentage / 100);
      totalPrice += subtotal + vat;
    });

    const { error: updateError } = await supabase
      .from('projects')
      .update({ total_price: totalPrice })
      .eq('id', projectId);

    if (updateError) throw updateError;

    return totalPrice;
  },
};

export const measurementService = {
  async create(measurement: Omit<MeasurementInsert, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('measurements')
      .insert(measurement)
      .select()
      .single();

    if (error) throw error;

    await this.updateProjectTotalM2(measurement.project_id);

    return data;
  },

  async update(id: string, updates: Partial<MeasurementInsert>) {
    const { data: measurement, error: fetchError } = await supabase
      .from('measurements')
      .select('project_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    const { data, error } = await supabase
      .from('measurements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (measurement) {
      await this.updateProjectTotalM2(measurement.project_id);
    }

    return data;
  },

  async delete(id: string) {
    const { data: measurement, error: fetchError } = await supabase
      .from('measurements')
      .select('project_id, photo_url')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (measurement?.photo_url) {
      const urlParts = measurement.photo_url.split('/');
      const filePath = urlParts.slice(-3).join('/');
      await supabase.storage.from('project-photos').remove([filePath]);
    }

    const { error } = await supabase
      .from('measurements')
      .delete()
      .eq('id', id);

    if (error) throw error;

    if (measurement) {
      await this.updateProjectTotalM2(measurement.project_id);
    }
  },

  async getByProject(projectId: string) {
    const { data, error } = await supabase
      .from('measurements')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('measurements')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateProjectTotalM2(projectId: string) {
    const { data: measurements, error: measurementsError } = await supabase
      .from('measurements')
      .select('net_area_m2')
      .eq('project_id', projectId);

    if (measurementsError) throw measurementsError;

    const totalM2 = measurements?.reduce((sum, m) => sum + m.net_area_m2, 0) || 0;

    const { error: updateError } = await supabase
      .from('projects')
      .update({ total_m2: totalM2 })
      .eq('id', projectId);

    if (updateError) throw updateError;

    return totalM2;
  }
};

export const visualizationService = {
  async create(data: {
    project_id: string;
    original_photo_url: string;
    detected_objects: any[];
  }) {
    const { data: visualization, error } = await supabase
      .from('visualizations')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return visualization;
  },

  async getByProject(projectId: string) {
    const { data, error } = await supabase
      .from('visualizations')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: {
    visualization_photo_url?: string;
    detected_objects?: any[];
    selected_product_id?: string;
  }) {
    const { error } = await supabase
      .from('visualizations')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('visualizations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

export const productService = {
  async getAll() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getByCategory(category: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false});

    if (error) throw error;
    return data;
  },

  async create(data: {
    category: string;
    name: string;
    product_image_url: string;
    brand?: string;
    price?: number;
    color?: string;
    style?: string;
    description?: string;
  }) {
    const { data: product, error } = await supabase
      .from('products')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return product;
  },

  async update(id: string, updates: any) {
    const { error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
