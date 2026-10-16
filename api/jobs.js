import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const supabaseUrl = 'https://yaowectkpqumdqkuypn.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseKey) {
      return res.status(500).json({ success: false, error: 'Не задан SUPABASE_SERVICE_ROLE_KEY на сервере' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    if (req.method === 'GET') {
      const { category } = req.query;
      let query = supabase.from('jobs').select('*').eq('status', 'active').order('created_at', { ascending: false });
      if (category) {
        query = query.eq('category', category);
      }
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json({ success: true, data: data || [] });
    }

    if (req.method === 'POST') {
      const { user, job } = req.body;
      if (!user || !job) {
        return res.status(400).json({ success: false, error: 'Неверные данные запроса' });
      }

      await supabase.from('users').upsert({ id: user.id, first_name: user.first_name });

      const { data, error } = await supabase.from('jobs').insert({
        employer_id: user.id,
        category: job.category,
        workers_count: job.workers_count,
        description: job.description,
        work_date_time: job.work_date_time,
        salary: job.salary,
        location: job.location,
        status: 'active'
      }).select().single();

      if (error) throw error;

      return res.status(200).json({ success: true, data, message: 'Вакансия успешно опубликована!' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
