import { property, state, query } from "lit/decorators.js";
import { css, html, LitElement } from "lit";
import {
  MdMenuSurface,
  MdList,
  MdListItem,
  MdOutlinedTextField,
} from "@scoped-elements/material-web";
import { consume } from "@lit-labs/context";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { localized, msg } from "@lit/localize";
import { AgentPubKey } from "@holochain/client";
import {
  asyncDeriveStore,
  AsyncReadable,
  AsyncStatus,
  lazyLoad,
  StoreSubscriber,
} from "@holochain-open-dev/stores";
import { SlSkeleton } from "@scoped-elements/shoelace";

import { Profile } from "../types";
import { ProfilesStore } from "../profiles-store";
import { profilesStoreContext } from "../context";
import { AgentAvatar } from "./agent-avatar";
import { ProfileListItemSkeleton } from "./profile-list-item-skeleton";
import { DisplayError, sharedStyles } from "@holochain-open-dev/elements";

/**
 * @element search-agent
 * @fires agent-selected - Fired when the user selects some agent. Detail will have this shape: { agentPubKey: HoloHash }
 */
@localized()
export class SearchAgent extends ScopedElementsMixin(LitElement) {
  /** Public attributes */

  /**
   * Whether to clear the field when an agent is selected.
   * @attr clear-on-select
   */
  @property({ type: Boolean, attribute: "clear-on-select" })
  clearOnSelect = false;

  /**
   * Whether to include my own agent as a possible agent to select.
   * @attr include-myself
   */
  @property({ type: Boolean, attribute: "include-myself" })
  includeMyself = false;

  /**
   * Label for the agent searching field.
   * @attr field-label
   */
  @property({ type: String, attribute: "field-label" })
  fieldLabel!: string;

  /**
   * @internal
   */
  @consume({ context: profilesStoreContext, subscribe: true })
  @state()
  _store!: ProfilesStore;

  /**
   * @internal
   */
  @state()
  private _searchProfiles:
    | StoreSubscriber<AsyncStatus<ReadonlyMap<AgentPubKey, Profile>>>
    | undefined;

  /**
   * @internal
   */
  @query("#textfield")
  private _textField!: MdOutlinedTextField;

  /**
   * @internal
   */
  @query("#overlay")
  private _overlay!: MdMenuSurface;

  firstUpdated() {
    this.addEventListener("blur", () => {
      (this._overlay as any).open = true;
    });
  }

  onFilterChange() {
    if ((this._textField as any).value.length < 3) {
      this._searchProfiles = undefined;
      return;
    }

    (this._overlay as any).open = true;
    const store = asyncDeriveStore(
      lazyLoad(async () =>
        this._store.client.searchAgents((this._textField as any).value)
      ),
      (agents) =>
        this._store.agentsProfiles(agents) as AsyncReadable<
          ReadonlyMap<AgentPubKey, Profile>
        >
    );
    this._searchProfiles = new StoreSubscriber(this, () => store);
  }

  onUsernameSelected([agentPubKey, profile]: [AgentPubKey, Profile]) {
    this.dispatchEvent(
      new CustomEvent("agent-selected", {
        detail: {
          agentPubKey,
        },
      })
    );

    // If the consumer says so, clear the field
    if (this.clearOnSelect) {
      (this._textField as any).value = "";
      this._searchProfiles = undefined;
    } else {
      (this._textField as any).value = profile.nickname;
    }
    (this._overlay as any).open = false;
  }

  renderAgentList() {
    if (this._searchProfiles === undefined) return html``;
    switch (this._searchProfiles.value.status) {
      case "pending":
        return html`
          <profile-list-item-skeleton></profile-list-item-skeleton>
          <profile-list-item-skeleton></profile-list-item-skeleton>
          <profile-list-item-skeleton></profile-list-item-skeleton>
        `;
      case "error":
        return html`
          <display-error
            style="flex: 1; display:flex"
            tooltip
            .error=${this._searchProfiles.value.error.data.data}
          ></display-error>
        `;
      case "complete": {
        const agents = this._searchProfiles.value.value;
        if (agents.size === 0)
          return html`<md-list-item
            .headline=${msg("No agents match the filter")}
          ></md-list-item>`;

        return html`
          <md-list style="min-width: 80px;">
            ${Array.from(agents.entries()).map(
              ([pubkey, profile]) => html` <md-list-item
                .headline=${profile.nickname}
                @click=${() => this.onUsernameSelected([pubkey, profile])}
              >
                <agent-avatar
                  slot="start"
                  .agentPubKey=${pubkey}
                ></agent-avatar>
              </md-list-item>`
            )}
          </md-list>
        `;
      }
    }
  }

  render() {
    return html`
      <div style="position: relative; flex: 1; display: flex;">
        <md-outlined-text-field
          id="textfield"
          style="flex: 1;"
          class="input"
          .label=${this.fieldLabel ?? msg("Search agent")}
          .placeholder=${msg("At least 3 chars...")}
          @input=${() => this.onFilterChange()}
        >
        </md-outlined-text-field>
        <md-menu-surface id="overlay" absolute x="4" y="28"
          >${this.renderAgentList()}</md-menu-surface
        >
      </div>
    `;
  }

  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          display: flex;
        }
        #list {
          margin-top: 16px;
          margin-left: 16px;
        }
      `,
    ];
  }

  /**
   * @ignore
   */
  static get scopedElements() {
    return {
      "sl-skeleton": SlSkeleton,
      "agent-avatar": AgentAvatar,
      "md-outlined-text-field": MdOutlinedTextField,
      "md-menu-surface": MdMenuSurface,
      "md-list": MdList,
      "display-error": DisplayError,
      "md-list-item": MdListItem,
      "profile-list-item-skeleton": ProfileListItemSkeleton,
    };
  }
}
