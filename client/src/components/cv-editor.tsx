import { useState, useRef, useEffect } from "react";

import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
// Icons available: Bold, Italic, List, Type, Indent, Outdent

interface CVEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function CVEditor({ value, onChange }: CVEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const initialized = useRef(false);

  // Set initial content once on mount
  useEffect(() => {
    const el = editorRef.current;
    if (el && !initialized.current) {
      el.innerHTML = value || '';
      initialized.current = true;
    }
  }, []); // mount only

  // Optional: re-sync when NOT focused (e.g., remote updates), never during typing
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const isFocused = document.activeElement === el;
    if (!isFocused && value != null && el.innerHTML !== value) {
      el.innerHTML = value;
    }
  }, [value]);

  // beforeinput listener to intercept Enter and create new bullets
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;

    const onBeforeInput = (e: InputEvent) => {
      // Only care about Enter default behavior
      if (e.inputType !== 'insertParagraph') {
        return;
      }

      const li = getCurrentLI();
      if (!li) {
        return; // not in a list item → let browser handle paragraph
      }

      // We are inside an <li>: prevent default and create a new bullet.
      e.preventDefault();

      const list = li.parentElement as HTMLOListElement | HTMLUListElement | null;
      if (!list) return;

      // If current LI is empty (or just <br>), end the list (match editor UX)
      const text = (li.textContent ?? '').replace(/\u200B/g, '').trim();
      const hasOnlyBR = li.childNodes.length === 1 && li.firstChild?.nodeName === 'BR';
      if (text.length === 0 || hasOnlyBR) {
        // Insert a paragraph after the list and move caret there
        const p = document.createElement('p');
        p.appendChild(document.createElement('br'));
        if (list.nextSibling) list.parentElement!.insertBefore(p, list.nextSibling);
        else list.parentElement!.appendChild(p);
        li.remove();
        if (list.children.length === 0) list.remove();

        // place caret at start of paragraph
        const r = document.createRange();
        r.setStart(p, 0); r.collapse(true);
        const s = window.getSelection(); s?.removeAllRanges(); s?.addRange(r);
        onChange(editorRef.current!.innerHTML);
        return;
      }

      // Normal case: split onto a NEW <li> after current
      const newLI = document.createElement('li');
      newLI.appendChild(document.createElement('br'));
      if (li.nextSibling) list.insertBefore(newLI, li.nextSibling);
      else list.appendChild(newLI);

      // Place caret inside the new <li>
      const r = document.createRange();
      r.setStart(newLI, 0); r.collapse(true);
      const s = window.getSelection(); s?.removeAllRanges(); s?.addRange(r);

      onChange(editorRef.current!.innerHTML);
    };

    // Capture phase gives us first shot at the input
    el.addEventListener('beforeinput', onBeforeInput as any, { capture: true });
    return () => el.removeEventListener('beforeinput', onBeforeInput as any, { capture: true } as any);
  }, [onChange]);

  const handleInput: React.FormEventHandler<HTMLDivElement> = () => {
    const el = editorRef.current;
    if (!el) return;
    onChange(el.innerHTML);
  };

  // === Utilities for list handling ===
  // Walk up from ANY Node (Text/Element) to find nearest element with tag
  function closestElement(node: Node | null, tag: string): HTMLElement | null {
    const t = tag.toLowerCase();
    while (node && (node as any).nodeType !== 9) { // stop at Document
      if ((node as any).nodeType === 1) { // ELEMENT_NODE
        const el = node as HTMLElement;
        if (el.tagName.toLowerCase() === t) return el;
      }
      node = (node as any).parentNode as Node | null;
    }
    return null;
  }

  function getCurrentLI(): HTMLLIElement | null {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const li = closestElement(sel.anchorNode, 'li') as HTMLLIElement | null;
    return li;
  }


  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    // Shift+Enter: insert soft line break within the current li
    if (e.key === "Enter" && e.shiftKey) {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      e.preventDefault();
      const br = document.createElement("br");
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(br);
      // Move caret after <br>
      range.setStartAfter(br);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      onChange(editorRef.current!.innerHTML);
      return;
    }
    // Plain Enter is now handled by beforeinput listener
  };

  // Note: execCommand function available but currently unused

  // Note: Bullet point and horizontal line functions available but currently unused

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">
        CV/Exhibition History
      </Label>
      

      
      <Card className="border">
        {/* Editor */}
        <CardContent className="p-0">
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`min-h-[300px] p-4 outline-none focus:ring-0 text-sm leading-relaxed ${isFocused ? 'bg-white' : 'bg-gray-50'}`}
            style={{
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word'
            }}
            suppressContentEditableWarning={true}
          />
        </CardContent>
      </Card>
      
      <p className="text-xs text-muted-foreground">
        Paste your formatted CV/Exhibition History content directly into the text area. Existing formatting will be preserved.
      </p>
    </div>
  );
}