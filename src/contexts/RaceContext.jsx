"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  onSnapshot,
  collection,
  query,
  orderBy,
  limit,
  doc,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRaceViewers } from "@/hooks/useRaceViewers";

const RaceContext = createContext(undefined);

export const useRace = () => {
  const context = useContext(RaceContext);
  if (context === undefined) {
    throw new Error("useRace must be used within a RaceProvider");
  }
  return context;
};

export const RaceProvider = ({ children }) => {
  const [currentRaceId, setCurrentRaceId] = useState(null);
  const [raceData, setRaceData] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [betOptions, setBetOptions] = useState([]);
  const [nextLapBetOptions, setNextLapBetOptions] = useState([]);
  const [isRaceFinished, setIsRaceFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [betOptionsSnapshot, nextLapBetOptionsSnapshot] =
          await Promise.all([
            getDocs(collection(db, "betOptions")),
            getDocs(collection(db, "nextLapBetOptions")),
          ]);

        setBetOptions(betOptionsSnapshot.docs.map((doc) => doc.data()));
        setNextLapBetOptions(
          nextLapBetOptionsSnapshot.docs.map((doc) => doc.data())
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error("An error occurred while fetching initial data")
        );
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const racesQuery = query(
      collection(db, "races"),
      orderBy("startTime", "desc"),
      limit(1)
    );
    const unsubRaces = onSnapshot(
      racesQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const raceDoc = snapshot.docs[0];
          setCurrentRaceId(raceDoc.id);
          setRaceData(raceDoc.data());
          setIsRaceFinished(raceDoc.data().status === "finished");
          setDrivers(raceDoc.data().drivers);
        }
        setIsLoading(false);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubRaces();
  }, []);

  useEffect(() => {
    if (!currentRaceId) return;

    const raceDocRef = doc(db, "races", currentRaceId);
    const unsubRace = onSnapshot(
      raceDocRef,
      (doc) => {
        if (doc.exists()) {
          setRaceData(doc.data());
          setIsRaceFinished(doc.data().status === "finished");
          setDrivers(doc.data().drivers);
          setViewerCount(doc.data().viewerCount || 0);
        }
      },
      (err) => {
        setError(err);
      }
    );

    return () => unsubRace();
  }, [currentRaceId]);

  const value = {
    currentRaceId,
    raceData,
    drivers,
    betOptions,
    nextLapBetOptions,
    isRaceFinished,
    isLoading,
    error,
    viewerCount,
  };

  return <RaceContext.Provider value={value}>{children}</RaceContext.Provider>;
};
