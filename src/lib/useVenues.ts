import useSWR from 'swr';
export function useVenues() {
  return useSWR('/data/venues.min.json.gz', url =>
    fetch(url).then(r => r.arrayBuffer()).then(buf =>
      new Response(new Blob([buf]).stream().pipeThrough(
        new DecompressionStream('gzip')
      )).json()
    )
  );
}