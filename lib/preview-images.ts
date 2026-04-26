import lqip from 'lqip-modern'
import type { ExtendedRecordMap, PreviewImage, PreviewImageMap } from 'notion-types'
import { getPageImageUrls } from 'notion-utils'
import pMap from 'p-map'
import { mapNotionImageUrl } from './map-page-url'

// Generates a low-quality image placeholder (base64 blur) for each image
// in the given RecordMap. Passed to NotionRenderer's previewImages map so
// images fade in rather than jumping from blank to full-resolution.
export async function getPreviewImages(
  recordMap: ExtendedRecordMap
): Promise<PreviewImageMap> {
  const urls = getPageImageUrls(recordMap, {
    // mapImageUrl rewrites Notion S3 URLs to our proxy so lqip can fetch them
    mapImageUrl: (url, block) => mapNotionImageUrl(url, block) ?? url,
  })

  const results = await pMap(
    urls,
    async (url): Promise<[string, PreviewImage | null]> => {
      try {
        // lqip-modern accepts a URL string and returns { metadata, dataURIBase64 }
        const result = await lqip(url)
        return [
          url,
          {
            originalWidth: result.metadata.originalWidth,
            originalHeight: result.metadata.originalHeight,
            dataURIBase64: result.metadata.dataURIBase64,
          },
        ]
      } catch {
        // Non-fatal: skip images that fail (auth-gated, deleted, etc.)
        return [url, null]
      }
    },
    { concurrency: 8 }
  )

  return Object.fromEntries(results.filter((r): r is [string, PreviewImage] => r[1] !== null))
}
