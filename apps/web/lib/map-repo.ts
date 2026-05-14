export function mapRepo(item: any) {
  return {
    id: item.id,
    name: item.name,
    fullName: item.full_name,
    owner: item.owner ? {
      login: item.owner.login,
      avatarUrl: item.owner.avatar_url || null,
      url: item.owner.html_url || null,
    } : undefined,
    description: item.description,
    stars: item.stargazers_count,
    url: item.html_url,
    language: item.language,
    updatedAt: item.updated_at,
  };
}
