-- Create a function to get artists without similarities
create or replace function get_artists_without_similarities()
returns table (
    id uuid,
    name varchar,
    image_url varchar,
    genres varchar[],
    created_at timestamptz
) as $$
begin
    return query
    select 
        a.id,
        a.name,
        a.image_url,
        a.genres,
        a.created_at
    from artists a
    where not exists (
        select 1 
        from similar_artists s 
        where s.artist1_id = a.id
    )
    order by a.created_at desc;
end;
$$ language plpgsql security definer; 