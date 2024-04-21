export type TrackType = {
  id: string;
  title: string;
  artists: Artist[];
  artist: string;
  album: Album;
  albumImageUrl: string;
  uri: string;
  name: string;
};

export type Artist = {
  name: string;
};

export type Album = {
  name: string;
  images: { url: string }[];
};

export type AddedTracksType = { [key: string]: boolean };
