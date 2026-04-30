// src/app/(private)/devblog/page.tsx
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
  { label: string; class: string; bg: string }
> = {
  novidade: {
    label: "Novidade",
    class: "text-sky-300 border-sky-500/30",
    bg: "bg-sky-500/10",
  },
  bugfix: {
    label: "Bugfix",
    class: "text-red-300 border-red-500/30",
    bg: "bg-red-500/10",
  },
  melhoria: {
    label: "Melhoria",
    class: "text-green-300 border-green-500/30",
    bg: "bg-green-500/10",
  },
  seguranca: {
    label: "Segurança",
    class: "text-amber-300 border-amber-500/30",
    bg: "bg-amber-500/10",
  },
  alerta: {
    label: "Alerta",
    class: "text-orange-300 border-orange-500/30",
    bg: "bg-orange-500/10",
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

    // converte YYYY-MM-DD pra DD/MM/YYYY antes de salvar
    const [year, month, day] = form.date.split("-");
    const dateFormatted = `${day}/${month}/${year}`;

    createPost(
      { ...form, date: dateFormatted },
      {
        onSuccess: () => {
          setOpen(false);
          setForm(emptyForm);
        },
      },
    );
  }

  const inputClass =
    "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:border-sky-500/50";
  const labelClass = "text-white/60 text-xs uppercase tracking-wider";

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Devblog</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Atualizações do GNOQ Core
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-300 text-sm hover:bg-sky-500/20 transition-all"
        >
          <PlusIcon className="w-4 h-4" />
          Novo post
        </button>
      </div>

      {/* lista de posts */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-5 h-5 rounded-full border-2 border-sky-500/30 border-t-sky-400 animate-spin" />
        </div>
      )}

      {!isLoading && (!posts || posts.length === 0) && (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <RssIcon className="w-8 h-8 text-white/10" />
          <p className="text-sm text-white/30">Nenhum post publicado ainda.</p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {posts?.map((post) => {
          const tc = typeConfig[post.type];
          return (
            <div
              key={post.id}
              className="rounded-xl border border-white/10 bg-white/2 p-6 flex flex-col gap-3"
            >
              {/* header do post */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className={`text-xs px-2 py-1 rounded-full border ${tc.class} ${tc.bg}`}
                  >
                    {tc.label}
                  </span>
                  <h2 className="text-base font-semibold text-white/90">
                    {post.title}
                  </h2>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-white/30">v{post.version}</p>
                    <p className="text-xs text-white/20">
                      {formatDate(post.date)}
                    </p>
                  </div>
                  <button
                    onClick={() => deletePost(post.id)}
                    className="p-1.5 text-white/20 hover:text-red-400 transition-colors"
                  >
                    <Trash2Icon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* conteúdo */}
              <p className="text-sm text-white/50 leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>
            </div>
          );
        })}
      </div>

      {/* dialog novo post */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#0d0d1a] border border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Novo post</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Título</Label>
              <Input
                placeholder="Ex: Correção no cálculo de distribuição"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className={labelClass}>Tipo</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => v && handleChange("type", v)}
                >
                  <SelectTrigger className="bg-white/5 w-full border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d0d1a] border-white/10 text-white">
                    <SelectItem value="novidade">Novidade</SelectItem>
                    <SelectItem value="bugfix">Bugfix</SelectItem>
                    <SelectItem value="melhoria">Melhoria</SelectItem>
                    <SelectItem value="seguranca">Segurança</SelectItem>
                    <SelectItem value="alerta">Alerta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className={labelClass}>Versão</Label>
                <Input
                  placeholder="Ex: 1.2.0"
                  value={form.version}
                  onChange={(e) => handleChange("version", e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className={labelClass}>Data</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Conteúdo</Label>
              <textarea
                placeholder="Descreva as mudanças..."
                value={form.content}
                onChange={(e) => handleChange("content", e.target.value)}
                required
                rows={6}
                className={`flex w-full rounded-md border px-3 py-2 text-sm resize-none ${inputClass}`}
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2 rounded-lg border border-sky-500/30 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-sm transition-all disabled:opacity-50"
            >
              {isPending ? "Publicando..." : "Publicar post"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
