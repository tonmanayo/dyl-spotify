import {
  useBreakpointValue,
  Container,
  Center,
  Heading,
  Flex,
  Box,
  SimpleGrid,
} from "@chakra-ui/react";
import "./App.css";
import { useEffect, useState } from "react";
import { AddedTracksType, TrackType } from "./types";
import {
  addTracksToPlaylist,
  checkForAccessToken,
  createPlaylist,
  getAccessToken,
  getSpotifyAuthorization,
  getUserId,
  searchSpotify,
} from "./Spotify/utils";
import JammingTitle from "./Components/JammingTitle";
import SearchBar from "./Components/SearchBar/SearchBar";
import Playlist from "./Components/Playlist/Playlist";
import SearchResults from "./Components/SearchResults/SearchResults";
import SavePlaylistAlert from "./Components/Playlist/SavePlaylistAlert";

function App() {
  const [searchResults, setSearchResults] = useState<TrackType[]>([]);
  const [playlistTracks, setPlaylistTracks] = useState<TrackType[]>([]);
  const [playlistName, setPlaylistName] = useState("New Playlist");
  const [addedTracks, setAddedTracks] = useState<AddedTracksType>({});
  const [hasSearched, setHasSearched] = useState(false);
  const [isPlaylistSaved, setIsPlaylistSaved] = useState(false);

  // Function to add a track to the playlist
  const addTrackToPlaylist = (trackToAdd: TrackType) => {
    if (!addedTracks[trackToAdd.id]) {
      setPlaylistTracks([...playlistTracks, trackToAdd]);
      setAddedTracks({ ...addedTracks, [trackToAdd.id]: true });
    }
  };

  // Function to remove a track from the playlist
  const removeTrackFromPlaylist = (trackToRemove: TrackType) => {
    setPlaylistTracks(
      playlistTracks.filter((track) => track.id !== trackToRemove.id)
    );
    setAddedTracks({ ...addedTracks, [trackToRemove.id]: false });
  };

  // Function to handle the change of the playlist name
  const handleNameChange = (name: string) => {
    setPlaylistName(name);
  };

  // Function to save the playlist to Spotify
  const savePlaylist = async () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      console.log("Access token is not available.");
      return;
    }

    if (!playlistName || !playlistTracks.length) {
      console.log("Playlist name or tracks are missing.");
      return;
    }

    const trackUris = playlistTracks.map((track) => track.uri);
    try {
      const userId = await getUserId(accessToken);
      const playlistId = await createPlaylist(
        userId,
        playlistName,
        accessToken
      );
      await addTracksToPlaylist(playlistId, trackUris, accessToken);
      setIsPlaylistSaved(true); // Set the state to true when the playlist is saved successfully

      // Reset the state after a delay
      setTimeout(() => {
        setIsPlaylistSaved(false);
      }, 3000);

      // Reset the existing playlist on the web app
      setPlaylistTracks([]);
      setPlaylistName("New Playlist");
      // Reset the addedTracks state
      setAddedTracks({});
      console.log("Playlist saved to Spotify!");
    } catch (error) {
      console.error("Error saving playlist:", error);
    }
  };

  // Function to handle search
  const handleSearch = async (term: string) => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      console.log("Access token is not available, redirecting to login.");
      getSpotifyAuthorization();
      return;
    }

    try {
      const results = await searchSpotify(term, accessToken);
      setSearchResults(results);
      setHasSearched(true); // Update the state to indicate that a search has been performed

      // Use the AddedTracksType for the reduce function's accumulator
      const newAddedTracks = results.reduce(
        (acc: AddedTracksType, track: TrackType) => {
          acc[track.id] = !!playlistTracks.find(
            (pTrack) => pTrack.id === track.id
          );
          return acc;
        },
        {} as AddedTracksType
      ); // Initialize the accumulator with the correct type

      setAddedTracks(newAddedTracks);
    } catch (error: unknown) {
      // Change 'error' to 'error: unknown'
      if (error instanceof Error && error.message.includes("401")) {
        console.log("Access token might be expired, redirecting to login.");
        getSpotifyAuthorization();
      } else {
        console.error("An unexpected error occurred:", error);
      }
    }
  };

  // Function to reset the search
  const handleReset = () => {
    setSearchResults([]); // Clear the search results
    setHasSearched(false);
  };

  // Initialize Spotify authentication on app load
  useEffect(() => {
    checkForAccessToken();
  }, []);

  // Determine if the playlist should be at the top based on the screen size
  const isLargerScreen = useBreakpointValue({ base: false, md: true });
  return (
    <div className="background-image">
      <div className="content">
        <Container centerContent maxW="container.xl">
          <Center flexDirection="column" w="100%" minH="100vh">
            <Heading marginBottom={20}>
              <JammingTitle />
            </Heading>
            <SearchBar
              onSearch={handleSearch}
              onReset={handleReset}
              hasSearched={hasSearched}
            />
            <Flex
              direction={{ base: "column", md: "row" }}
              justify="center"
              align="start"
              p={55}
            >
              {isLargerScreen && (
                <Box w="100%" p={4}>
                  <Playlist
                    tracks={playlistTracks}
                    onRemove={removeTrackFromPlaylist}
                    onSave={savePlaylist}
                    playlistName={playlistName}
                    onNameChange={handleNameChange}
                  />
                </Box>
              )}
              <Box w={{ base: "100%", md: "50%" }} p={4} ml={{ lg: "10%" }}>
                {searchResults.length > 0 && (
                  <Heading as="h2">Search Results</Heading>
                )}
                <SimpleGrid columns={{ sm: 2, md: 3, lg: 4 }} spacing="20px">
                  <SearchResults
                    searchResults={searchResults}
                    onAdd={addTrackToPlaylist}
                    addedTracks={addedTracks}
                  />
                </SimpleGrid>
              </Box>
              {!isLargerScreen && (
                <Box w="100%" p={4}>
                  <Playlist
                    tracks={playlistTracks}
                    onRemove={removeTrackFromPlaylist}
                    onSave={savePlaylist}
                    playlistName={playlistName}
                    onNameChange={handleNameChange}
                  />
                </Box>
              )}
            </Flex>
          </Center>
        </Container>
        {isPlaylistSaved && <SavePlaylistAlert />}
      </div>
    </div>
  );
}

export default App;
