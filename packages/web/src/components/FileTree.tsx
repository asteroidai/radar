import { FileText, Folder } from "lucide-react";
import type { KnowledgeFile } from "@/lib/mock-data";

interface FileTreeProps {
  files: KnowledgeFile[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

interface GroupedFiles {
  root: KnowledgeFile[];
  dirs: Record<string, KnowledgeFile[]>;
}

function groupFiles(files: KnowledgeFile[]): GroupedFiles {
  const result: GroupedFiles = { root: [], dirs: {} };
  for (const file of files) {
    const slashIdx = file.path.indexOf("/");
    if (slashIdx === -1) {
      result.root.push(file);
    } else {
      const dir = file.path.slice(0, slashIdx);
      (result.dirs[dir] ??= []).push(file);
    }
  }
  return result;
}

export function FileTree({ files, selectedPath, onSelect }: FileTreeProps) {
  const { root, dirs } = groupFiles(files);

  return (
    <div className="space-y-1">
      {root.map((f) => (
        <FileItem
          key={f.path}
          file={f}
          selected={f.path === selectedPath}
          onSelect={onSelect}
        />
      ))}
      {Object.entries(dirs).map(([dir, dirFiles]) => (
        <div key={dir} className="mt-3">
          <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            <Folder className="h-3 w-3" />
            {dir}
          </div>
          <div className="ml-2 space-y-0.5">
            {dirFiles.map((f) => (
              <FileItem
                key={f.path}
                file={f}
                selected={f.path === selectedPath}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FileItem({
  file,
  selected,
  onSelect,
}: {
  file: KnowledgeFile;
  selected: boolean;
  onSelect: (path: string) => void;
}) {
  const fileName = file.path.includes("/")
    ? file.path.split("/").pop()!
    : file.path;

  return (
    <button
      onClick={() => onSelect(file.path)}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
        selected
          ? "bg-white text-zinc-900 font-medium shadow-sm"
          : "text-zinc-500 hover:bg-white/60 hover:text-zinc-900"
      }`}
    >
      <FileText className="h-3 w-3 shrink-0 text-zinc-400" />
      {fileName}
    </button>
  );
}
