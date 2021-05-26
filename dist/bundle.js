//@ts-ignore
import { createUniqueTag } from '@open-wc/scoped-elements/src/createUniqueTag';
import { ListProfiles } from './elements/list-profiles';
import { ProfilesService } from './profiles.service';
import { ProfilesStore } from './profiles.store';
// TODO: FIX THIS
function renderUnique(tag, baseClass, root) {
    const registry = customElements;
    const uniqueTag = createUniqueTag(tag, registry);
    root.innerHTML = `
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
            <${uniqueTag}></${uniqueTag}>
      `;
    registry.define(uniqueTag, class extends baseClass {
    });
}
export default function lenses(appWebsocket, cellId) {
    const profilesService = new ProfilesService(appWebsocket, cellId);
    const store = new ProfilesStore(profilesService);
    return {
        standalone: [
            {
                name: 'List Profiles',
                render(root) {
                    renderUnique('list-profiles', ListProfiles, root);
                },
            },
        ],
        entryLenses: {},
        attachmentsLenses: [],
    };
}
//# sourceMappingURL=bundle.js.map