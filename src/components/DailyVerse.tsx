import { useMemo, useState } from "react";
import { BookOpen, Share2, Check, Copy, Image, Loader2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const VERSES = [
  { text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.", reference: "João 3:16" },
  { text: "O Senhor é o meu pastor; nada me faltará.", reference: "Salmos 23:1" },
  { text: "Tudo posso naquele que me fortalece.", reference: "Filipenses 4:13" },
  { text: "Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento.", reference: "Provérbios 3:5" },
  { text: "Não temas, porque eu sou contigo; não te assombres, porque eu sou teu Deus.", reference: "Isaías 41:10" },
  { text: "Busquem, pois, em primeiro lugar o Reino de Deus e a sua justiça, e todas essas coisas lhes serão acrescentadas.", reference: "Mateus 6:33" },
  { text: "Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará.", reference: "Salmos 37:5" },
  { text: "Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor; pensamentos de paz, e não de mal, para vos dar o fim que esperais.", reference: "Jeremias 29:11" },
  { text: "Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.", reference: "Mateus 11:28" },
  { text: "O amor é paciente, o amor é bondoso. Não inveja, não se vangloria, não se orgulha.", reference: "1 Coríntios 13:4" },
  { text: "Alegrem-se sempre no Senhor. Novamente direi: alegrem-se!", reference: "Filipenses 4:4" },
  { text: "Ora, a fé é o firme fundamento das coisas que se esperam, e a prova das coisas que se não veem.", reference: "Hebreus 11:1" },
  { text: "Eu sou o caminho, a verdade e a vida. Ninguém vem ao Pai senão por mim.", reference: "João 14:6" },
  { text: "Deem graças em todas as circunstâncias, pois esta é a vontade de Deus para vocês em Cristo Jesus.", reference: "1 Tessalonicenses 5:18" },
  { text: "Sê forte e corajoso; não temas, nem te espantes, porque o Senhor, teu Deus, é contigo, por onde quer que andares.", reference: "Josué 1:9" },
  { text: "Se confessarmos os nossos pecados, ele é fiel e justo para nos perdoar os pecados e nos purificar de toda injustiça.", reference: "1 João 1:9" },
  { text: "Mas os que esperam no Senhor renovarão as suas forças; subirão com asas como águias.", reference: "Isaías 40:31" },
  { text: "Pois onde estiver o vosso tesouro, aí estará também o vosso coração.", reference: "Mateus 6:21" },
  { text: "O Senhor é a minha luz e a minha salvação; a quem temerei?", reference: "Salmos 27:1" },
  { text: "Aquele que habita no abrigo do Altíssimo descansará à sombra do Todo-Poderoso.", reference: "Salmos 91:1" },
  { text: "Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.", reference: "1 Pedro 5:7" },
  { text: "Eu vim para que tenham vida, e a tenham em abundância.", reference: "João 10:10" },
  { text: "A palavra de Deus é viva e eficaz, e mais cortante do que qualquer espada de dois gumes.", reference: "Hebreus 4:12" },
  { text: "Bem-aventurados os puros de coração, porque eles verão a Deus.", reference: "Mateus 5:8" },
  { text: "E conhecereis a verdade, e a verdade vos libertará.", reference: "João 8:32" },
  { text: "Fiel é o que vos chama, o qual também o fará.", reference: "1 Tessalonicenses 5:24" },
  { text: "Sejam fortes e corajosos. Não tenham medo nem fiquem apavorados, pois o Senhor, o seu Deus, estará com vocês.", reference: "Deuteronômio 31:6" },
  { text: "Porque pela graça sois salvos, por meio da fé; e isto não vem de vós, é dom de Deus.", reference: "Efésios 2:8" },
  { text: "Eis que estou à porta e bato; se alguém ouvir a minha voz e abrir a porta, entrarei em sua casa.", reference: "Apocalipse 3:20" },
  { text: "O fruto do Espírito é amor, alegria, paz, paciência, amabilidade, bondade, fidelidade, mansidão e domínio próprio.", reference: "Gálatas 5:22-23" },
  { text: "Aquieta-te perante o Senhor e espera nele.", reference: "Salmos 37:7" },
];

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

export function DailyVerse() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showImageDialog, setShowImageDialog] = useState(false);

  const verse = useMemo(() => {
    const dayOfYear = getDayOfYear();
    return VERSES[dayOfYear % VERSES.length];
  }, []);

  const shareText = `"${verse.text}"\n\n— ${verse.reference}\n\n✨ Versículo do dia via METANOIA HUB`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast({ title: "Copiado!", description: "Versículo copiado para a área de transferência." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Erro", description: "Não foi possível copiar.", variant: "destructive" });
    }
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
      } catch {
        // User cancelled share
      }
    }
  };

  const handleGenerateImage = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-verse-image', {
        body: { verseText: verse.text, verseReference: verse.reference }
      });

      if (error) throw error;
      if (!data?.imageUrl) throw new Error('No image returned');

      setGeneratedImage(data.imageUrl);
      setShowImageDialog(true);
      toast({ title: "Imagem gerada!", description: "Sua imagem está pronta para compartilhar." });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({ 
        title: "Erro ao gerar imagem", 
        description: "Tente novamente mais tarde.",
        variant: "destructive" 
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadImage = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `versiculo-${verse.reference.replace(/\s/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareImage = async () => {
    if (!generatedImage || !navigator.share) return;

    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const file = new File([blob], 'versiculo.png', { type: 'image/png' });

      await navigator.share({
        files: [file],
        title: verse.reference,
        text: shareText
      });
    } catch {
      // Fallback to download
      handleDownloadImage();
    }
  };

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <>
      <section className="bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 rounded-2xl border border-primary/10 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-wide">Versículo do Dia</span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-full hover:bg-primary/10 transition-colors">
                <Share2 className="w-4 h-4 text-primary" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleWhatsApp} className="cursor-pointer">
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </DropdownMenuItem>
              {canNativeShare && (
                <DropdownMenuItem onClick={handleNativeShare} className="cursor-pointer">
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartilhar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleCopy} className="cursor-pointer">
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? "Copiado!" : "Copiar texto"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleGenerateImage} className="cursor-pointer" disabled={generating}>
                {generating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Image className="w-4 h-4 mr-2" />
                )}
                {generating ? "Gerando..." : "Gerar imagem"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <blockquote className="space-y-3">
          <p className="font-serif text-lg leading-relaxed text-foreground italic">
            "{verse.text}"
          </p>
          <footer className="text-sm font-medium text-muted-foreground">
            — {verse.reference}
          </footer>
        </blockquote>
      </section>

      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Imagem do Versículo</DialogTitle>
          </DialogHeader>
          {generatedImage && (
            <div className="space-y-4">
              <img 
                src={generatedImage} 
                alt={`Versículo ${verse.reference}`}
                className="w-full rounded-lg"
              />
              <div className="flex gap-2">
                <Button onClick={handleDownloadImage} variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Baixar
                </Button>
                {canNativeShare && (
                  <Button onClick={handleShareImage} className="flex-1">
                    <Share2 className="w-4 h-4 mr-2" />
                    Compartilhar
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
