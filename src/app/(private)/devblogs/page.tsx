"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/helpers/formatDate";
import {
  useCreatePost,
  useDeletePost,
  useListPosts,
} from "@/hooks/secondary/use-devblog";
import { PostType } from "@/types/secondary/devblog-types";
import { PlusIcon, RssIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

const typeConfig: Record<
  PostType,
  { label: string; color: string; bg: string; border: string }
> = {
  novidade: {
    label: "Novidade",
    color: "#00719C",
    bg: "rgba(0,113,156,0.10)",
    border: "rgba(0,113,156,0.30)",
  },
  bugfix: {
    label: "Bugfix",
    color: "#b91c1c",
    bg: "rgba(185,28,28,0.10)",
    border: "rgba(185,28,28,0.30)",
  },
  melhoria: {
    label: "Melhoria",
    color: "#15803d",
    bg: "rgba(21,128,61,0.10)",
    border: "rgba(21,128,61,0.30)",
  },
  seguranca: {
    label: "Segurança",
    color: "#b45309",
    bg: "rgba(180,83,9,0.10)",
    border: "rgba(180,83,9,0.30)",
  },
  alerta: {
    label: "Alerta",
    color: "#c2410c",
    bg: "rgba(194,65,12,0.10)",
    border: "rgba(194,65,12,0.30)",
  },
};

const emptyForm = {
  title: "",
  type: "novidade" as PostType,
  version: "",
  date: new Date().toISOString().split("T")[0],
  content: "",
};

export default function DevblogPage() {
  const { data: posts, isLoading } = useListPosts();
  const { mutate: createPost, isPending } = useCreatePost();
  const { mutate: deletePost } = useDeletePost();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const [year, month, day] = form.date.split("-");
    createPost(
      { ...form, date: `${day}/${month}/${year}` },
      {
        onSuccess: () => {
          setOpen(false);
          setForm(emptyForm);
        },
      },
    );
  }

  const inputStyle = {
    background: "var(--bg-base)",
    borderColor: "var(--border)",
    color: "var(--text-primary)",
  };
  const labelClass = "text-xs uppercase tracking-wider font-medium";
  const sectionStyle = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: 24,
  };

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Devblog
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Atualizações do GNOQ Core
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            background: "var(--primary)",
            color: "#ffffff",
            border: "1px solid var(--primary)",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--primary-light)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "var(--primary)")
          }
        >
          <PlusIcon className="w-4 h-4" />
          Novo post
        </button>
      </div>

      {/* loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div
            className="w-5 h-5 rounded-full border-2 animate-spin"
            style={{
              borderColor: "var(--primary-border)",
              borderTopColor: "var(--primary)",
            }}
          />
        </div>
      )}

      {/* vazio */}
      {!isLoading && (!posts || posts.length === 0) && (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <RssIcon className="w-8 h-8" style={{ color: "var(--text-faint)" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Nenhum post publicado ainda.
          </p>
        </div>
      )}

      {/* lista */}
      <div className="flex flex-col gap-4">
        {posts?.map((post) => {
          const tc = typeConfig[post.type];
          return (
            <div
              key={post.id}
              style={sectionStyle}
              className="flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className="text-xs px-2 py-1 rounded-full"
                    style={{
                      color: tc.color,
                      background: tc.bg,
                      border: `1px solid ${tc.border}`,
                    }}
                  >
                    {tc.label}
                  </span>
                  <h2
                    className="text-base font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {post.title}
                  </h2>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p
                      className="text-xs font-medium"
                      style={{ color: "var(--text-muted)" }}
                    >
                      v{post.version}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-faint)" }}
                    >
                      {formatDate(post.date)}
                    </p>
                  </div>
                  <button
                    onClick={() => deletePost(post.id)}
                    className="p-1.5 transition-colors"
                    style={{ color: "var(--text-faint)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "var(--error)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "var(--text-faint)")
                    }
                  >
                    <Trash2Icon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p
                className="text-sm leading-relaxed whitespace-pre-wrap"
                style={{ color: "var(--text-secondary)" }}
              >
                {post.content}
              </p>
            </div>
          );
        })}
      </div>

      {/* dialog novo post */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "var(--text-primary)" }}>
              Novo post
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <Label
                className={labelClass}
                style={{ color: "var(--text-muted)" }}
              >
                Título
              </Label>
              <Input
                placeholder="Ex: Correção no cálculo de distribuição"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label
                  className={labelClass}
                  style={{ color: "var(--text-muted)" }}
                >
                  Tipo
                </Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => v && handleChange("type", v)}
                >
                  <SelectTrigger
                    className="w-full"
                    style={{ ...inputStyle, height: 36 }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {Object.entries(typeConfig).map(([key, tc]) => (
                      <SelectItem
                        key={key}
                        value={key}
                        style={{ color: tc.color }}
                      >
                        {tc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label
                  className={labelClass}
                  style={{ color: "var(--text-muted)" }}
                >
                  Versão
                </Label>
                <Input
                  placeholder="Ex: 1.2.0"
                  value={form.version}
                  onChange={(e) => handleChange("version", e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label
                  className={labelClass}
                  style={{ color: "var(--text-muted)" }}
                >
                  Data
                </Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                className={labelClass}
                style={{ color: "var(--text-muted)" }}
              >
                Conteúdo
              </Label>
              <textarea
                placeholder="Descreva as mudanças..."
                value={form.content}
                onChange={(e) => handleChange("content", e.target.value)}
                required
                rows={6}
                className="flex w-full rounded-md border px-3 py-2 text-sm resize-none"
                style={{ ...inputStyle, outline: "none" }}
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
              style={{
                background: "var(--primary)",
                color: "#ffffff",
                border: "1px solid var(--primary)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--primary-light)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "var(--primary)")
              }
            >
              {isPending ? "Publicando..." : "Publicar post"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
