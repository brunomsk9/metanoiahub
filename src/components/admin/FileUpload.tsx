import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Upload, Loader2, X, FileText, Image as ImageIcon, Link } from 'lucide-react';

interface FileUploadProps {
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  folder?: string;
  label?: string;
  placeholder?: string;
}

export function FileUpload({
  value,
  onChange,
  accept = '.pdf,.png,.jpg,.jpeg,.webp',
  folder = 'uploads',
  label = 'Arquivo',
  placeholder = 'Cole uma URL ou faça upload'
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo: 10MB');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('materiais')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Erro ao fazer upload: ' + uploadError.message);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('materiais')
        .getPublicUrl(fileName);

      onChange(publicUrl);
      toast.success('Upload concluído!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao fazer upload');
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleClear = () => {
    onChange('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const isImage = value && /\.(jpg|jpeg|png|webp|gif)$/i.test(value);
  const isPdf = value && /\.pdf$/i.test(value);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="border-gray-300 focus:border-amber-500 focus:ring-amber-500 pr-10"
          />
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          id={`file-upload-${folder}`}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="border-gray-300 hover:bg-gray-50"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Preview */}
      {value && (
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
          {isImage ? (
            <>
              <ImageIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <img
                src={value}
                alt="Preview"
                className="h-16 w-auto rounded object-cover"
              />
            </>
          ) : isPdf ? (
            <>
              <FileText className="h-4 w-4 text-red-600 flex-shrink-0" />
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-amber-600 hover:underline truncate"
              >
                {value.split('/').pop()}
              </a>
            </>
          ) : (
            <>
              <Link className="h-4 w-4 text-gray-600 flex-shrink-0" />
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-amber-600 hover:underline truncate"
              >
                {value}
              </a>
            </>
          )}
        </div>
      )}
    </div>
  );
}
