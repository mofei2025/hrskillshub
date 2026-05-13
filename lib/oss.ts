import OSS from 'ali-oss'

export function createOSSClient() {
  return new OSS({
    region: process.env.OSS_REGION!,
    accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
    bucket: process.env.OSS_BUCKET!,
  })
}

export async function uploadToOSS(buffer: Buffer, filename: string): Promise<string> {
  const client = createOSSClient()
  const key = `skills/${Date.now()}-${filename}`
  const result = await client.put(key, buffer)
  return result.url
}
