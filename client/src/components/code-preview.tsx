import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CodePreviewProps {
  code: string;
  filename?: string;
  language?: string;
  animated?: boolean;
  copyable?: boolean;
  compact?: boolean;
}

export function CodePreview({ 
  code, 
  filename = "code.js", 
  language = "javascript",
  animated = false,
  copyable = false,
  compact = false
}: CodePreviewProps) {
  const [copied, setCopied] = useState(false);
  const [displayedCode, setDisplayedCode] = useState(animated ? "" : code);
  const { toast } = useToast();

  useEffect(() => {
    if (animated) {
      let index = 0;
      const interval = setInterval(() => {
        if (index < code.length) {
          setDisplayedCode(code.slice(0, index + 1));
          index++;
        } else {
          clearInterval(interval);
        }
      }, 20);

      return () => clearInterval(interval);
    }
  }, [code, animated]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "Code has been copied to your clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy code to clipboard",
        variant: "destructive",
      });
    }
  };

  const getLanguageIcon = () => {
    switch (language) {
      case 'javascript':
      case 'js':
        return '🟨';
      case 'typescript':
      case 'ts':
        return '🔵';
      case 'python':
      case 'py':
        return '🐍';
      case 'dockerfile':
        return '🐳';
      case 'yaml':
      case 'yml':
        return '📄';
      case 'bash':
      case 'shell':
        return '💻';
      default:
        return '📝';
    }
  };

  const formatCode = (code: string) => {
    const lines = code.split('\n');
    return lines.map((line, index) => {
      // Simple syntax highlighting
      let formattedLine = line;
      
      // Comments
      if (line.trim().startsWith('//') || line.trim().startsWith('#')) {
        return <div key={index} className="text-gray-500">{line}</div>;
      }
      
      // Keywords for JavaScript/TypeScript
      if (language === 'javascript' || language === 'js' || language === 'typescript' || language === 'ts') {
        formattedLine = formattedLine
          .replace(/(const|let|var|function|async|await|return|if|else|for|while|class|import|export|from|require)/g, '<span class="text-purple-400">$1</span>')
          .replace(/(GET|POST|PUT|DELETE|JWT)/g, '<span class="text-green-400">$1</span>')
          .replace(/(['"`])(.*?)\1/g, '<span class="text-orange-400">$1$2$1</span>');
      }
      
      // Docker keywords
      if (language === 'dockerfile') {
        formattedLine = formattedLine
          .replace(/(FROM|RUN|COPY|WORKDIR|EXPOSE|CMD|ENV|ARG)/g, '<span class="text-purple-400">$1</span>');
      }
      
      // YAML keys
      if (language === 'yaml' || language === 'yml') {
        formattedLine = formattedLine
          .replace(/^(\s*)([a-zA-Z_][a-zA-Z0-9_]*:)/gm, '$1<span class="text-yellow-400">$2</span>');
      }

      return (
        <div 
          key={index} 
          className="leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formattedLine }}
        />
      );
    });
  };

  return (
    <div className={`bg-dark-card rounded-xl border border-gray-800 overflow-hidden shadow-2xl ${animated ? 'animate-float' : ''}`}>
      <div className="bg-gray-900 px-4 py-3 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <span className="text-sm text-gray-400 ml-4 flex items-center space-x-2">
            <span>{getLanguageIcon()}</span>
            <span>{filename}</span>
          </span>
        </div>
        {copyable && (
          <Button
            onClick={handleCopy}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-neon-cyan transition-colors duration-200"
          >
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span className="ml-1">{copied ? 'Copied' : 'Copy'}</span>
          </Button>
        )}
      </div>
      <div className={`p-4 ${compact ? 'h-32' : 'h-80'} overflow-y-auto font-mono text-sm`}>
        <div className="space-y-1">
          {formatCode(displayedCode)}
          {animated && displayedCode.length < code.length && (
            <span className="inline-block w-2 h-5 bg-neon-cyan animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
