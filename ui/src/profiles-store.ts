import { CellClient } from '@holochain-open-dev/cell-client';
import {
  AgentPubKeyB64,
  Dictionary,
  serializeHash,
} from '@holochain-open-dev/core-types';
import merge from 'lodash-es/merge';

import { ProfilesService } from './profiles-service';
import { AgentProfile, Profile } from './types';
import { writable, Writable, derived, Readable, get } from 'svelte/store';
import { defaultConfig, ProfilesConfig } from './config';

export class ProfilesStore {
  /** Private */
  private _service: ProfilesService;
  private _knownProfilesStore: Writable<Dictionary<Profile>> = writable({});

  /** Static info */
  public myAgentPubKey: AgentPubKeyB64;

  /** Readable stores */

  // Store containing all the profiles that have been fetched
  // The key is the agentPubKey of the agent
  public knownProfiles: Readable<Dictionary<Profile>> = derived(
    this._knownProfilesStore,
    i => i
  );

  // Store containing my profile
  public myProfile: Readable<Profile> = derived(
    this._knownProfilesStore,
    profiles => profiles[this.myAgentPubKey]
  );

    // Returns a store with the profile of the given agent
  profileOf(agentPubKey: AgentPubKeyB64): Readable<Profile> {
    return derived(this._knownProfilesStore, profiles => profiles[agentPubKey]);
  }

  config: ProfilesConfig;

  constructor(
    protected cellClient: CellClient,
    config: Partial<ProfilesConfig> = {}
  ) {
    this.config = merge(defaultConfig, config);
    this._service = new ProfilesService(cellClient, this.config.zomeName);
    this.myAgentPubKey = serializeHash(cellClient.cellId[1]);
  }

  /** Actions */

  /**
   * Fetches the profiles for all agents in the DHT
   * 
   * You can subscribe to `knowProfiles` to get updated with all the profiles when this call is done
   * 
   * Warning! Can be very slow
   */
  async fetchAllProfiles(): Promise<void> {
    const allProfiles = await this._service.getAllProfiles();

    this._knownProfilesStore.update(profiles => {
      for (const profile of allProfiles) {
        profiles[profile.agentPubKey] = profile.profile;
      }
      return profiles;
    });
  }

  /**
   * Fetches the profile for the given agent
   */
  async fetchAgentProfile(
    agentPubKey: AgentPubKeyB64
  ): Promise<Profile | undefined> {
    // For now, optimistic return of the cached profile
    // TODO: implement cache invalidation

    const knownProfiles = get(this._knownProfilesStore);

    if (knownProfiles[agentPubKey]) return knownProfiles[agentPubKey];

    const profile = await this._service.getAgentProfile(agentPubKey);

    if (!profile) return;

    this._knownProfilesStore.update(profiles => {
      profiles[profile.agentPubKey] = profile.profile;
      return profiles;
    });
    return profile.profile;
  }

  /**
   * Fetches the profiles for the given agents in the DHT
   * 
   * You can subscribe to knowProfiles to get updated with all the profiles when this call is done
   * 
   * Use this over `fetchAgentProfile` when fetching multiple profiles, as it will be more performant
   */
  async fetchAgentsProfiles(agentPubKeys: AgentPubKeyB64[]): Promise<void> {
    // For now, optimistic return of the cached profile
    // TODO: implement cache invalidation

    const knownProfiles = get(this._knownProfilesStore);

    const agentsWeAlreadKnow = Object.keys(knownProfiles);
    const profilesToFetch = agentPubKeys.filter(
      pubKey => !agentsWeAlreadKnow.includes(pubKey)
    );

    if (profilesToFetch.length === 0) {
      return;
    }

    const fetchedProfiles = await this._service.getAgentsProfiles(
      profilesToFetch
    );

    this._knownProfilesStore.update(profiles => {
      for (const fetchedProfile of fetchedProfiles) {
        profiles[fetchedProfile.agentPubKey] = fetchedProfile.profile;
      }
      return profiles;
    });
  }

  /**
   * Fetch my profile
   * 
   * You can subscribe to `myProfile` to get updated with my profile
   */
  async fetchMyProfile(): Promise<void> {
    const profile = await this._service.getMyProfile();
    if (profile) {
      this._knownProfilesStore.update(profiles => {
        profiles[profile.agentPubKey] = profile.profile;
        return profiles;
      });
    }
  }

  /**
   * Search the profiles for the agent with nicknames starting with the given nicknamePrefix
   * 
   * @param nicknamePrefix must be of at least 3 characters
   * @returns the profiles with the nickname starting with nicknamePrefix
   */
  async searchProfiles(nicknamePrefix: string): Promise<AgentProfile[]> {
    const searchedProfiles = await this._service.searchProfiles(nicknamePrefix);

    this._knownProfilesStore.update(profiles => {
      for (const profile of searchedProfiles) {
        profiles[profile.agentPubKey] = profile.profile;
      }
      return profiles;
    });
    return searchedProfiles;
  }

  /**
   * Create my profile
   * 
   * Note that there is no guarantee on nickname uniqness
   * 
   * @param profile profile to be created
   */
  async createProfile(profile: Profile): Promise<void> {
    await this._service.createProfile(profile);

    this._knownProfilesStore.update(profiles => {
      profiles[this.myAgentPubKey] = profile;
      return profiles;
    });
  }
}