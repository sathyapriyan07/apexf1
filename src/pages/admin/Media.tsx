import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Image as ImageIcon, Trash2, ExternalLink, Search, Filter, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function AdminMedia() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchFiles();
  }, []);

  async function fetchFiles() {
    setLoading(true);
    try {
      // List files from all folders in f1-archive bucket
      const folders = ['drivers', 'constructors', 'seasons', 'races'];
      const allFiles: any[] = [];

      for (const folder of folders) {
        const { data, error } = await supabase.storage
          .from('f1-archive')
          .list(folder, {
            limit: 100,
            offset: 0,
            sortBy: { column: 'name', order: 'desc' },
          });

        if (error) throw error;
        if (data) {
          const filesWithUrls = data.map(file => {
            const { data: { publicUrl } } = supabase.storage
              .from('f1-archive')
              .getPublicUrl(`${folder}/${file.name}`);
            
            return {
              ...file,
              folder,
              url: publicUrl,
              id: `${folder}/${file.name}`
            };
          });
          allFiles.push(...filesWithUrls);
        }
      }

      setFiles(allFiles.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (folder: string, name: string) => {
    if (!confirm('Are you sure you want to delete this file? This cannot be undone.')) return;

    try {
      const { error } = await supabase.storage
        .from('f1-archive')
        .remove([`${folder}/${name}`]);

      if (error) throw error;
      fetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file.');
    }
  };

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.folder.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Media Library</h1>
          <p className="text-gray-400">Manage all uploaded images and assets.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-red-600 outline-none w-64"
            />
          </div>
          <button
            onClick={fetchFiles}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            title="Refresh"
          >
            <Loader2 className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredFiles.map((file) => (
            <div key={file.id} className="group bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden hover:border-red-600/50 transition-all">
              <div className="aspect-square relative overflow-hidden bg-black flex items-center justify-center">
                <img
                  src={file.url}
                  alt={file.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                    title="View Original"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(file.folder, file.name)}
                    className="p-2 bg-red-600/20 hover:bg-red-600/40 rounded-lg text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-1 bg-black/60 backdrop-blur-md rounded-md text-[10px] font-bold text-white uppercase tracking-wider">
                    {file.folder}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs font-medium text-gray-300 truncate mb-1" title={file.name}>
                  {file.name}
                </p>
                <p className="text-[10px] text-gray-500 uppercase font-bold">
                  {(file.metadata?.size / 1024).toFixed(1)} KB • {new Date(file.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredFiles.length === 0 && (
        <div className="text-center py-20 bg-zinc-900/50 border border-dashed border-white/10 rounded-3xl">
          <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No media files found.</p>
        </div>
      )}
    </div>
  );
}
