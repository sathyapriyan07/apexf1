import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, X, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface FileUploadProps {
  onUpload: (url: string) => void;
  currentUrl?: string;
  bucket: string;
  folder?: string;
  className?: string;
}

export default function FileUpload({ onUpload, currentUrl, bucket, folder = '', className }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onUpload(data.publicUrl);
      setPreview(data.publicUrl);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setPreview('');
    onUpload('');
  };

  return (
    <div className={cn("space-y-4", className)}>
      {preview ? (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 group">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <button
            onClick={removeImage}
            className="absolute top-2 right-2 p-2 bg-black/60 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-red-600/50 hover:bg-red-600/5 transition-all group">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {uploading ? (
              <Loader2 className="w-10 h-10 text-red-600 animate-spin mb-4" />
            ) : (
              <Upload className="w-10 h-10 text-gray-500 group-hover:text-red-600 mb-4 transition-colors" />
            )}
            <p className="mb-2 text-sm text-gray-400">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">PNG, JPG or WebP (MAX. 2MB)</p>
          </div>
          <input 
            type="file" 
            className="hidden" 
            accept="image/*" 
            onChange={handleUpload} 
            disabled={uploading}
          />
        </label>
      )}
    </div>
  );
}
