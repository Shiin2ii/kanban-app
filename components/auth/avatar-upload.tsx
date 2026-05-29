"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Camera, Trash2, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createBrowserClient } from "@/lib/supabase/client"
import { updateAvatarUrl, removeAvatar } from "@/lib/actions/profile"

const MAX_SIZE = 256       // px — max width/height sau khi nén
const JPEG_QUALITY = 0.85  // 0–1

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      // Tính kích thước giữ tỉ lệ
      let { width, height } = img
      if (width > MAX_SIZE || height > MAX_SIZE) {
        if (width > height) {
          height = Math.round((height * MAX_SIZE) / width)
          width = MAX_SIZE
        } else {
          width = Math.round((width * MAX_SIZE) / height)
          height = MAX_SIZE
        }
      }

      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      if (!ctx) return reject(new Error("Canvas context unavailable"))
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Compression failed"))
          resolve(blob)
        },
        "image/jpeg",
        JPEG_QUALITY
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error("Không thể đọc ảnh"))
    }

    img.src = objectUrl
  })
}

type Props = {
  initials: string
  avatarUrl?: string | null
  userId: string
}

export function AvatarUpload({ initials, avatarUrl, userId }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [preview, setPreview] = useState<string | null>(avatarUrl ?? null)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!inputRef.current) inputRef.current!.value = ""
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Chỉ chấp nhận file ảnh")
      return
    }

    setError(null)

    // Show instant preview trước khi upload
    const localPreview = URL.createObjectURL(file)
    setPreview(localPreview)

    startTransition(async () => {
      try {
        const compressed = await compressImage(file)

        const supabase = createBrowserClient()
        const path = `${userId}/avatar`

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, compressed, {
            contentType: "image/jpeg",
            upsert: true,
          })

        if (uploadError) throw new Error(uploadError.message)

        // Lấy public URL (thêm cache-bust để browser không dùng ảnh cũ)
        const { data } = supabase.storage
          .from("avatars")
          .getPublicUrl(path)

        const publicUrl = `${data.publicUrl}?t=${Date.now()}`

        const result = await updateAvatarUrl(publicUrl)
        if (result.error) throw new Error(result.error)

        setPreview(publicUrl)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload thất bại")
        setPreview(avatarUrl ?? null)
      } finally {
        URL.revokeObjectURL(localPreview)
        if (inputRef.current) inputRef.current.value = ""
      }
    })
  }

  function handleRemove() {
    startTransition(async () => {
      const result = await removeAvatar()
      if (result.error) {
        setError(result.error)
      } else {
        setPreview(null)
        router.refresh()
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        nativeButton={false}
        render={
          <div
            role="button"
            tabIndex={0}
            className="relative group rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            title="Đổi ảnh đại diện"
          />
        }
      >
        <Avatar className="h-8 w-8">
          {preview && <AvatarImage src={preview} alt={initials} />}
          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
            {isPending
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : initials}
          </AvatarFallback>
        </Avatar>
        {/* Camera overlay khi hover */}
        <span className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <Camera className="h-3 w-3 text-white" />
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
        >
          <Camera className="h-4 w-4 mr-2" />
          Đổi ảnh đại diện
        </DropdownMenuItem>
        {preview && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleRemove}
              disabled={isPending}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa ảnh
            </DropdownMenuItem>
          </>
        )}
        {error && (
          <>
            <DropdownMenuSeparator />
            <p className="px-2 py-1 text-[11px] text-destructive">{error}</p>
          </>
        )}
      </DropdownMenuContent>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
        aria-hidden
      />
    </DropdownMenu>
  )
}
