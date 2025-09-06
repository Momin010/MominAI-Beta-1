import React from 'react';
import { Icons } from '../components/Icon';

const ReactIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  React.createElement('svg', { viewBox: "-10.5 -9.45 21 18.9", fill: "none", xmlns: "http://www.w3.org/2000/svg", ...props, color: "#61DAFB" },
    React.createElement('circle', { cx: "0", cy: "0", r: "2", fill: "currentColor" }),
    React.createElement('g', { stroke: "currentColor", strokeWidth: "1", fill: "none" },
      React.createElement('ellipse', { rx: "10", ry: "4.5" }),
      React.createElement('ellipse', { rx: "10", ry: "4.5", transform: "rotate(60)" }),
      React.createElement('ellipse', { rx: "10", ry: "4.5", transform: "rotate(120)" })
    )
  )
);

const HTMLIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", ...props, color: "#E34F26" },
        React.createElement('path', { d: "m10 16-2-2 2-2"}),
        React.createElement('path', { d: "m14 16 2-2-2-2"})
    )
);


const CSSIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", ...props, color: "#1572B6" },
        React.createElement('path', { d: "M10.33 18.5 8 16l2.33-2.5"}),
        React.createElement('path', { d: "M13.67 18.5 16 16l-2.33-2.5"})
    )
);

const TSIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", ...props, color: "#3178C6" },
        React.createElement('path', { d: "M12.25 19.25 9.75 14l-2.5 5.25"}),
        React.createElement('path', { d: "m14.5 14-1.5 2.75"}),
        React.createElement('path', { d: "M10.25 16.5h3"})
    )
);


const JSIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", ...props, color: "#F7DF1E" },
        React.createElement('path', { d: "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-1 14h-1a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1zm5-1a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1z" })
    )
);

const JSONIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", ...props, color: "#A9A9A9" },
    React.createElement('path', { d: "M8 10h.01" }),
    React.createElement('path', { d: "M12 10h.01" }),
    React.createElement('path', { d: "M16 10h.01" }),
    React.createElement('path', { d: "M8 14h.01" }),
    React.createElement('path', { d: "M12 14h.01" }),
    React.createElement('path', { d: "M16 14h.01" }),
    React.createElement('rect', { x: "3", y: "3", width: "18", height: "18", rx: "2" })
  )
);

const MarkdownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", ...props, color: "#FFFFFF" },
        React.createElement('path', { d: "M12 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-2" }),
        React.createElement('path', { d: "M4 4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" }),
        React.createElement('path', { d: "m10 12-2 2 2 2" }),
        React.createElement('path', { d: "m14 8 2 2-2 2" })
    )
);


const fileIcons: Record<string, React.FC<any>> = {
  js: JSIcon,
  jsx: ReactIcon,
  ts: TSIcon,
  tsx: ReactIcon,
  html: HTMLIcon,
  css: CSSIcon,
  json: JSONIcon,
  md: MarkdownIcon,
};

export const getIconForFile = (filename: string): React.FC<any> => {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  return fileIcons[extension] || Icons.File;
};