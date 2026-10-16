import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yaowectkpqumdqkuypn.supabase.co';
const SUPABASE_KEY = 'sb_secret_6hZ683gnM17kaO64NRqVeg_QrVmyqmn';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
  });

  try {
    // GET: Получение списка вакансий
    if (req.method === 'GET') {
      const { category } = req.query || {};
      let query = supabase.from('jobs').select('*').eq('status', 'active').order('created_at', { ascending: false });
      
      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;

      return res.status(200).json({ success: true, data: data || [] });
    }

    // POST: Создание вакансии
    if (req.method === 'POST') {
      const { user, job } = req.body || {};

      if (!user || !job) {
        return res.status(400).json({ success: false, error: 'Не переданы данные пользователя или вакансии' });
      }

      // Сохранение/обновление пользователя
      const { error: userError } = await supabase
        .from('users')
        .upsert({ id: user.id, first_name: user.first_name });

      if (userError) throw userError;

      // Создание вакансии
      const { data, error: jobError } = await supabase
        .from('jobs')
        .insert({
          employer_id: user.id,
          category: job.category,
          workers_count: job.workers_count,
          description: job.description,
          work_date_time: job.work_date_time,
          salary: job.salary,
          location: job.location,
          status: 'active'
        })
        .select()
        .single();

      if (jobError) throw jobError;

      return res.status(200).json({ success: true, data, message: 'Вакансия успешно опубликована!' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Внутренняя ошибка сервера' });
  }
}
