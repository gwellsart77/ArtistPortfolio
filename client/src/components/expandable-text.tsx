import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
  className?: string;
}

export function ExpandableText({ text, maxLength = 200, className = "" }: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text || text.length <= maxLength) {
    return <p className={className}>{text}</p>;
  }

  const truncatedText = text.slice(0, maxLength);
  const remainingText = text.slice(maxLength);

  return (
    <div className={className}>
      <p className="leading-relaxed">
        {truncatedText}
        {!isExpanded && (
          <>
            <span>...</span>
            <Button
              variant="link"
              className="p-0 h-auto text-blue-600 hover:text-blue-800 ml-1 font-medium"
              onClick={() => setIsExpanded(true)}
            >
              read more
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </>
        )}
        {isExpanded && (
          <>
            {remainingText}
            <Button
              variant="link"
              className="p-0 h-auto text-blue-600 hover:text-blue-800 ml-2 font-medium"
              onClick={() => setIsExpanded(false)}
            >
              read less
              <ChevronUp className="h-4 w-4 ml-1" />
            </Button>
          </>
        )}
      </p>
    </div>
  );
}