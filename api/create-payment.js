import { createClient } from '@supabase/supabase-js';

// Инициализация Supabase на бекенде с использованием Secret Key
const supabase = createClient(
  'https://yaowectkpqumdqkuypn.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY // Секретный ключ из Supabase
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { jobId } = req.body;

    // Здесь в будущем будет интеграция с API ЮKassa / СБП для получения реальной ссылки на оплату
    // const paymentUrl = "https://yoomoney.ru/checkout/...";

    // Для бесперебойного теста пока сделаем авто-активацию после "оплаты"
    const { error } = await supabase
      .from('jobs')
      .update({ status: 'active' })
      .eq('id', jobId);

    if (error) throw error;

    return res.status(200).json({ 
      success: true, 
      message: 'Вакансия успешно оплачена и опубликована!' 
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
