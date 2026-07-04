'use client';

import { useEffect, useId, useState } from 'react';

type MermaidDiagramProps = {
  chart: string;
};

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const rawId = useId();
  const id = `niva-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const [svg, setSvg] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function renderDiagram() {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: 'base',
          themeVariables: {
            primaryColor: '#fdf1f4',
            primaryBorderColor: '#df6d8b',
            primaryTextColor: '#25171d',
            lineColor: '#3e8077',
            secondaryColor: '#e7f4f1',
            tertiaryColor: '#fff8e7',
          },
        });

        const result = await mermaid.render(id, chart);
        if (mounted) {
          setSvg(result.svg);
          setFailed(false);
        }
      } catch {
        if (mounted) {
          setFailed(true);
        }
      }
    }

    void renderDiagram();

    return () => {
      mounted = false;
    };
  }, [chart, id]);

  if (failed) {
    return <pre className="mermaid-fallback">{chart}</pre>;
  }

  return (
    <div
      aria-label="Architecture diagram"
      className="mermaid-shell"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
