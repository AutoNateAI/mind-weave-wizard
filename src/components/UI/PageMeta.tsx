import { Helmet } from "react-helmet-async";

type PageMetaProps = {
  title: string;
  description?: string;
  canonical?: string;
};

export function PageMeta({ title, description, canonical }: PageMetaProps) {
  const desc = description ??
    "Thinking Wizard by AutoNateAI: graph-powered learning with interactive games, lectures, and reflections.";
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={desc} />
      {canonical && <link rel="canonical" href={canonical} />}
    </Helmet>
  );
}
