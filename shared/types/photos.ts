export interface GalleryPhoto {
  id: string
  width: number
  height: number
  color: string | null
  alt: string
  src: string
  srcset: string
  href: string
  photographer: string
  photographerUrl: string
}

export interface GalleryResponse {
  photos: GalleryPhoto[]
  page: number
  hasMore: boolean
}
