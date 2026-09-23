begin;

-- Expose stored image dimensions on the public summaries view so card/hero
-- thumbnails can reserve their exact aspect-ratio box before the image loads
-- (zero layout shift). Postgres `create or replace view` cannot insert columns
-- in the middle of the existing column list, so we drop and recreate. Columns
-- are integer 0 when a post has no stored dims; the app treats 0 as "unknown"
-- and falls back to a default ratio.

drop view if exists public.public_post_summaries;

create view public.public_post_summaries
with (security_invoker = true)
as
select
  p.id,
  p.data->>'slug' as slug,
  p.data->>'title' as title,
  p.data->>'description' as description,
  coalesce(p.data->'seoKeywords', '[]'::jsonb) as seo_keywords,
  p.data->>'thumbnailUrl' as thumbnail_url,
  coalesce((p.data->>'thumbnailWidth')::integer, 0) as thumbnail_width,
  coalesce((p.data->>'thumbnailHeight')::integer, 0) as thumbnail_height,
  coalesce(p.data->'tags', '[]'::jsonb) as tags,
  p.data->>'category' as category,
  coalesce(p.data->'categories', '[]'::jsonb) as categories,
  coalesce(
    (
      select jsonb_agg(distinct tool order by tool)
      from (
        select t.tool
        from jsonb_array_elements_text(
               case when jsonb_typeof(coalesce(p.data->'aiTools', '[]'::jsonb)) = 'array'
                    then coalesce(p.data->'aiTools', '[]'::jsonb)
                    else '[]'::jsonb end
             ) as t(tool)
        union all
        select t.tool
        from jsonb_array_elements(
               case when jsonb_typeof(coalesce(p.data->'images', '[]'::jsonb)) = 'array'
                    then coalesce(p.data->'images', '[]'::jsonb)
                    else '[]'::jsonb end
             ) as img,
             jsonb_array_elements_text(
               case when jsonb_typeof(coalesce(img->'aiTools', '[]'::jsonb)) = 'array'
                    then coalesce(img->'aiTools', '[]'::jsonb)
                    else '[]'::jsonb end
             ) as t(tool)
        union all
        select img->>'aiTool'
        from jsonb_array_elements(
               case when jsonb_typeof(coalesce(p.data->'images', '[]'::jsonb)) = 'array'
                    then coalesce(p.data->'images', '[]'::jsonb)
                    else '[]'::jsonb end
             ) as img
        where img->>'aiTool' is not null and img->>'aiTool' <> ''
      ) as t
      where tool is not null and tool <> ''
    ),
    '[]'::jsonb
  ) as ai_tools,
  coalesce((p.data->>'featured')::boolean, false) as featured,
  coalesce((p.data->>'views')::integer, 0) as views,
  coalesce((p.data->>'likes')::integer, 0) as likes,
  coalesce((p.data->>'isPremium')::boolean, false) as is_premium,
  coalesce((p.data->>'isTemplate')::boolean, false) as is_template,
  coalesce(p.data->>'status', 'published') as status,
  coalesce(p.data->>'visibility', 'public') as visibility,
  p.data->>'createdAt' as created_at,
  p.data->>'featuredAt' as featured_at,
  case
    when jsonb_typeof(p.data->'images') = 'array'
      and jsonb_array_length(p.data->'images') > 0
    then jsonb_build_array(
      jsonb_build_object(
        'id', coalesce(p.data->'images'->0->>'id', p.id),
        'url', coalesce(p.data->>'thumbnailUrl', p.data->'images'->0->>'url', ''),
        'prompt', '',
        'aiTool', coalesce(p.data->'images'->0->>'aiTool', p.data->'aiTools'->>0, ''),
        'aiTools', coalesce(p.data->'images'->0->'aiTools', p.data->'aiTools', '[]'::jsonb),
        'model', p.data->'images'->0->>'model',
        'width', p.data->'images'->0->>'width',
        'height', p.data->'images'->0->>'height'
      )
    )
    else '[]'::jsonb
  end as images
from public.posts as p;

grant select on public.public_post_summaries to anon, authenticated;

commit;
