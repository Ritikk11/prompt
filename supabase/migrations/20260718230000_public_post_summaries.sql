begin;

create index if not exists posts_public_slug_idx
  on public.posts ((data->>'slug'))
  where coalesce(data->>'status', 'published') = 'published'
    and coalesce(data->>'visibility', 'public') <> 'private'
    and nullif(data->>'slug', '') is not null;

create or replace view public.public_post_summaries
with (security_invoker = true)
as
select
  p.id,
  p.data->>'slug' as slug,
  p.data->>'title' as title,
  p.data->>'description' as description,
  coalesce(p.data->'seoKeywords', '[]'::jsonb) as seo_keywords,
  p.data->>'thumbnailUrl' as thumbnail_url,
  coalesce(p.data->'tags', '[]'::jsonb) as tags,
  p.data->>'category' as category,
  coalesce(p.data->'categories', '[]'::jsonb) as categories,
  -- Match the app's getAllTools(): union the post-level aiTools with every
  -- image's aiTools/aiTool, so tool/tag discovery pages see the same set the
  -- old in-JS aggregation produced (a post can carry a tool only on an image).
  -- Every jsonb_array_elements* call is guarded by a jsonb_typeof = 'array'
  -- check so a malformed non-array value on any row can never raise and break
  -- the view for the whole table.
  coalesce(
    (
      select jsonb_agg(distinct tool order by tool)
      from (
        -- post-level aiTools
        select t.tool
        from jsonb_array_elements_text(
               case when jsonb_typeof(coalesce(p.data->'aiTools', '[]'::jsonb)) = 'array'
                    then coalesce(p.data->'aiTools', '[]'::jsonb)
                    else '[]'::jsonb end
             ) as t(tool)
        union all
        -- per-image aiTools arrays
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
        -- per-image scalar aiTool
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
        'model', p.data->'images'->0->>'model'
      )
    )
    else '[]'::jsonb
  end as images
from public.posts as p;

grant select on public.public_post_summaries to anon, authenticated;

create or replace function public.get_public_post_by_slug_or_id(p_slug_or_id text)
returns table (id text, data jsonb)
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
  select p.id, p.data
  from public.posts as p
  where p.id = p_slug_or_id
     or p.data->>'slug' = p_slug_or_id
  limit 1;
$$;

revoke all on function public.get_public_post_by_slug_or_id(text) from public;
grant execute on function public.get_public_post_by_slug_or_id(text) to anon, authenticated;

commit;
