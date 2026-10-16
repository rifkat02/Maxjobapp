import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://yaowectkpqumdqkuypn.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const { category } = req.query;
      let query = supabase.from('jobs').select('*').eq('status', 'active').order('created_at', { ascending: false });
      if (category) {
        query = query.eq('category', category);
      }
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json({ success: true, data });
    }

    if (req.method === 'POST') {
      const { user, job } = req.body;
      
      await supabase.from('users').upsert({ id: user.id, first_name: user.first_name });

      const { data, error } = await supabase.from('jobs').insert({
        employer_id: user.id,
        category: job.category,
        workers_count: job.workers_count,
        description: job.description,
        work_date_time: job.work_date_time,
        salary: job.salary,
        location: job.location,
        status: 'active' // Сразу активная для теста
      }).select().single();

      if (error) throw error;

      return res.status(200).json({ success: true, data, message: 'Вакансия успешно опубликована!' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
