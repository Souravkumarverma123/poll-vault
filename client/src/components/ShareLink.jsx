import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, QrCode } from 'lucide-react';
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function ShareLink({ shareId }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/respond/${shareId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Tabs defaultValue="link">
      <TabsList className="mb-4">
        <TabsTrigger value="link">Link</TabsTrigger>
        <TabsTrigger value="qr">
          <QrCode className="mr-1.5 h-3.5 w-3.5" />QR Code
        </TabsTrigger>
      </TabsList>

      <TabsContent value="link">
        <div className="flex items-center gap-2">
          <Input
            readOnly
            value={url}
            className="font-mono text-sm bg-muted/50"
            onClick={(e) => e.target.select()}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0">
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{copied ? 'Copied!' : 'Copy link'}</TooltipContent>
          </Tooltip>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Share this link with your respondents.</p>
      </TabsContent>

      <TabsContent value="qr">
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="rounded-xl border bg-white p-4">
            <QRCodeSVG value={url} size={180} level="M" includeMargin={false} />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Scan to open the poll. Download by right-clicking the QR code.
          </p>
          <p className="text-xs font-mono text-muted-foreground/60 text-center break-all">{url}</p>
        </div>
      </TabsContent>
    </Tabs>
  );
}
