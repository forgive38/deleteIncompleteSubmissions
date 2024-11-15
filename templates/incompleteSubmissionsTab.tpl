<tab id="incompleteSubmissions" label="{translate key="submissions.incomplete"}" :badge="components.incompleteSubmissions.itemsMax">
    <submissions-list-panel
        v-bind="components.incompleteSubmissions"
        @set="set"
    >

    <template v-slot:item="{ldelim}item{rdelim}">
        {* apiURL = {ldelim}{ldelim}components.incompleteSubmissions.apiUrl{rdelim}{rdelim}<br/> *}
        <incomplete-submissions-list-item
            :key="item.id"
            :item="item"
            :components="components"
            :apiUrl="components.incompleteSubmissions.apiUrl"
            :infoUrl="components.incompleteSubmissions.infoUrl"
            :assignParticipantUrl="components.incompleteSubmissions.assignParticipantUrl"
            @addFilter="components.incompleteSubmissions.addFilter"
            />
        </template>
    </submission-list-panel>
    
</tab>
