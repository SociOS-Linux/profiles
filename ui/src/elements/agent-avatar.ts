import { AgentPubKeyB64 } from '@holochain-open-dev/core-types';
import { contextProvided } from '@holochain-open-dev/context';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { profilesStoreContext } from '../context';
import { ProfilesStore } from '../profiles-store';
import { HoloIdenticon } from './holo-identicon';
import { SlAvatar, SlSkeleton } from '@scoped-elements/shoelace';
import { StoreSubscriber } from 'lit-svelte-stores';
import { sharedStyles } from './utils/shared-styles';

export class AgentAvatar extends ScopedElementsMixin(LitElement) {
  /** Public properties */

  /**
   * REQUIRED. The public key identifying the agent whose profile is going to be shown.
   */
  @property({
    attribute: 'agent-pub-key',
    type: String,
  })
  agentPubKey!: AgentPubKeyB64;

  /**
   * Size of the avatar image in pixels.
   */
  @property({ type: Number })
  size = 32;

  /** Dependencies */

  /**
   * `ProfilesStore` that is requested via context.
   * Only set this property if you want to override the store requested via context.
   */
  @contextProvided({ context: profilesStoreContext })
  @property({ type: Object })
  store!: ProfilesStore;

  private _profile = new StoreSubscriber(this, () =>
    this.store.profileOf(this.agentPubKey)
  );

  async firstUpdated() {
    if (this.store.config.avatarMode === 'avatar') {
      await this.store.fetchAgentProfile(this.agentPubKey);
    }
  }

  render() {
    if (this.store.config.avatarMode === 'identicon')
      return html`<holo-identicon
        .hash=${this.agentPubKey}
        .size=${this.size}
      ></holo-identicon>`;
    if (this._profile.value)
      return html`
        <sl-avatar
          .image=${this._profile.value.fields.avatar}
          style="--size: ${this.size}px;"
        >
          <div slot="icon"></div>
        </sl-avatar>
      `;
    return html`<sl-skeleton
      effect="pulse"
      style="height: ${this.size}px; width: ${this.size}px"
    ></sl-skeleton>`;
  }

  /**
   * @ignore
   */
  static get scopedElements() {
    return {
      'holo-identicon': HoloIdenticon,
      'sl-avatar': SlAvatar,
      'sl-skeleton': SlSkeleton,
    };
  }

  static styles = [sharedStyles];
}