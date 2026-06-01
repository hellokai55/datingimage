import 'server-only';

const EVOLINK_API_URL = 'https://api.evolink.ai/v1';
const API_KEY = process.env.EVOLINK_API_KEY;

if (!API_KEY) {
  throw new Error('EVOLINK_API_KEY is not set');
}

const SCENE_PROMPTS: Record<string, string> = {
  beach: 'a beautiful beach at golden hour with ocean waves in the background',
  coffee: 'a cozy modern coffee shop with warm ambient lighting and plants',
  office: 'a professional office environment with natural lighting through large windows',
  street: 'an urban city street at dusk with neon lights and urban architecture',
  outdoor: 'a scenic mountain or forest landscape with natural daylight',
  art: 'a modern art gallery with white walls and dramatic lighting',
  wine: 'an upscale wine bar with soft candlelight and elegant decor',
  gym: 'a modern fitness center with professional lighting and equipment',
};

export async function createGenerationTask(params: {
  scene: string;
  imageUrls: string[];
  count?: number;
}) {
  const { scene, imageUrls, count = 8 } = params;

  const sceneDesc = SCENE_PROMPTS[scene] || scene;

  const prompt = `Generate a realistic dating profile photo. Scene: ${sceneDesc}. Style: Natural, flattering lighting, professional quality, dating-app ready. Keep the person's facial features authentic and recognizable. High quality portrait photography.`;

  const response = await fetch(`${EVOLINK_API_URL}/images/generations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-image-2',
      prompt,
      image_urls: imageUrls.slice(0, 16),
      size: '1024x1024',
      quality: 'high',
      n: count,
      webhook_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://datingimage.vercel.app'}/api/webhooks/evolink`,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`EvoLink API error: ${error}`);
  }

  const data = await response.json();
  return data;
}

export async function getTaskResult(taskId: string) {
  const response = await fetch(`${EVOLINK_API_URL}/tasks/${taskId}`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch task result');
  }

  return response.json();
}
