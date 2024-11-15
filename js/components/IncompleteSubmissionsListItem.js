let listItemTemplate = pkp.Vue.compile(`
	<div class="listPanel__item--submission">
			<div class="listPanel__itemSummary">
				<div class="listPanel__itemIdentity listPanel__itemIdentity--submission">
					<div class="listPanel__item--submission__id">
						{{ item.id }}
					</div>
					<div class="listPanel__itemTitle">
						<span v-if="currentUserIsReviewer">
							{{ __('submission.list.reviewAssignment') }}
						</span>
						<span v-else-if="currentPublication.authorsStringShort">
							{{ currentPublication.authorsStringShort }}
						</span>
					</div>
					<div class="listPanel__itemSubtitle">
						{{
							localizeSubmission(
								currentPublication.fullTitle,
								currentPublication.locale
							)
						}}
					</div>
	
					<!-- Review assignment information -->
					<div
						v-if="currentUserIsReviewer"
						class="listPanel__item--submission__reviewDetails"
					>
						<span
							v-if="currentUserLatestReviewAssignment.responsePending"
							class="listPanel__item--submission__dueDate"
						>
							{{
								__('submission.list.responseDue', {
									date: currentUserLatestReviewAssignment.responseDue
								})
							}}
						</span>
						<span
							v-if="currentUserLatestReviewAssignment.reviewPending"
							class="listPanel__item--submission__dueDate"
						>
							{{
								__('submission.list.reviewDue', {
									date: currentUserLatestReviewAssignment.due
								})
							}}
						</span>
					</div>
	
					<!-- Warnings and notices -->
					<div
						v-if="reviewerWorkflowLink"
						class="listPanel__item--submission__notice"
					>
						<span v-html="reviewerWorkflowLink" />
					</div>
					<div v-else-if="notice" class="listPanel__item--submission__notice">
						<icon icon="exclamation-triangle" :inline="true" />
						{{ notice }}
						<button
							v-if="shouldAssignEditor"
							class="-linkButton"
							@click.stop.prevent="openAssignParticipant"
						>
							{{ __('submission.list.assignEditor') }}
						</button>
					</div>
				</div>
	
				<div class="listPanel__itemActions">
					<!-- Workflow stage information -->
					<div
						v-if="!currentUserIsReviewer"
						class="listPanel__item--submission__itemSummaryDetails"
					>
						<div class="listPanel__item--submission__itemSummaryDetailsRow">
							<!-- use aria-hidden on these details because the information can be
								more easily acquired by screen readers from the details panel. -->
							<div class="listPanel__item--submission__flags" aria-hidden="true">
								<span v-if="isReviewStage">
									<icon icon="user-o" :inline="true" />
									{{ completedReviewsCount }}/{{
										currentReviewAssignments.length
									}}
								</span>
								<span v-if="activeStage.files.count">
									<icon icon="file-text-o" :inline="true" />
									{{ activeStage.files.count }}
								</span>
								<span v-if="openQueryCount">
									<icon icon="comment-o" :inline="true" />
									{{ openQueryCount }}
								</span>
							</div>
							<badge
								class="listPanel__item--submission__stage"
								:isButton="!isArchived"
								:label="currentStageDescription"
								:stage="isArchived ? '' : currentStage"
								:isPrimary="isScheduled"
								:isSuccess="isPublished"
								:isWarnable="isDeclined"
								@click="filterByStage(activeStage.id)"
							>
								{{ currentStageLabel }}
							</badge>
						</div>
					</div>
	
					<!-- Review status -->
					<template v-else>
						<div
							v-if="currentUserLatestReviewAssignment.reviewCancelled"
							class="listPanel__item--submission__reviewCancelled"
						>
							<icon icon="exclamation-triangle" :inline="true" />
							{{ __('submission.list.reviewCancelled') }}
						</div>
						<div
							v-if="currentUserLatestReviewAssignment.reviewComplete"
							class="listPanel__item--submission__reviewComplete"
						>
							<icon icon="check" :inline="true" />
							{{ __('submission.list.reviewComplete') }}
						</div>
					</template>
	
					<!-- Actions -->
					<pkp-button element="a" :href="item.urlWorkflow">
						<span aria-hidden="true">{{ __('common.view') }}</span>
						<span v-if="currentUserIsReviewer" class="-screenReader">
							{{
								__('common.viewWithName', {
									name: localizeSubmission(
										currentPublication.fullTitle,
										currentPublication.locale
									)
								})
							}}
						</span>
						<span v-else class="-screenReader">
							{{
								__('common.viewWithName', {
									name: currentPublication.authorsStringShort
								})
							}}
						</span>
					</pkp-button>
					<expander
						v-if="!currentUserIsReviewer"
						:isExpanded="isExpanded"
						:itemName="currentPublication.authorsStringShort"
						@toggle="isExpanded = !isExpanded"
					/>
				</div>
			</div>
	
			<!-- Expanded panel -->
			<div
				v-if="isExpanded"
				class="listPanel__itemExpanded listPanel__itemExpanded--submission"
			>
				<list>
					<list-item v-if="isReviewStage">
						<template slot="value">
							<icon icon="user-o" :inline="true" />
							{{ completedReviewsCount }}/{{ currentReviewAssignments.length }}
						</template>
						{{ __('submission.list.reviewsCompleted') }}
					</list-item>
					<list-item v-if="!isSubmissionStage">
						<template slot="value">
							<icon icon="file-text-o" :inline="true" />
							{{ activeStage.files.count }}
						</template>
						{{ activeStageFilesLabel }}
					</list-item>
					<list-item v-if="!item.submissionProgress">
						<template slot="value">
							<icon icon="comment-o" :inline="true" />
							{{ openQueryCount }}
						</template>
						{{ __('submission.list.discussions') }}
					</list-item>
					<list-item v-if="dualWorkflowLinks">
						<span v-html="dualWorkflowLinks" />
					</list-item>
					<list-item>
						<span>
							{{
								__('common.lastActivity', {
									date: localizeDate(item.dateLastActivity)
								})
							}}
						</span>
					</list-item>
				</list>
				<div class="listPanel__itemExpandedActions">
					<pkp-button v-if="currentUserCanViewInfoCenter" @click="openInfoCenter">
						{{ __('submission.list.infoCenter') }}
					</pkp-button>
					<pkp-button
						v-if="currentUserCanDelete"
						:isWarnable="true"
						@click="deleteSubmissionPromptLocal"
					>
						{{ __('common.delete') }}
					</pkp-button>
				</div>
			</div>
		</div>
	`);
	pkp.Vue.component('incomplete-submissions-list-item', {
		name: 'IncompleteSubmissionsListItem',
		extends: pkp.controllers.Container.components.SubmissionsListPanel.components.SubmissionsListItem,
		props: {
			components: {
				type: Object,
				require: true,
			},
		},
		data() {
			return {
				apiUrlLocal: this.components.incompleteSubmissions.apiUrl,
			};
		},
		computed: {
			currentUserCanDelete() {
				if (
					!this.userAssignedRole(pkp.const.ROLE_ID_AUTHOR) &&
					this.userAssignedRole([
						pkp.const.ROLE_ID_MANAGER,
						pkp.const.ROLE_ID_SITE_ADMIN
					]) &&
					this.item.submissionProgress
				) {
					return true;
				}
				return false;
			},
			currentUserCanViewInfoCenter() {
				return false;
			}
		},
		methods: {
			/**
			 * Display a confirmation prompt before deleting a submission
			 */
			// deleteSubmissionPromptLocal() {
			// 	this.openDialog({
			// 		cancelLabel: this.__('common.no'),
			// 		modalName: 'deleteSubmission',
			// 		message: this.__('editor.submissionArchive.confirmDelete'),
			// 		title: this.__('common.delete'),
			// 		callback: this.deleteSubmissionLocal
			// 	});
			// },

			/**
		 * Display a confirmation prompt before deleting a submission
		 */
		deleteSubmissionPromptLocal() {
			this.openDialog({
				name: 'deleteSubmission',
				title: this.__('common.delete'),
				message: this.__('editor.submissionArchive.confirmDelete'),
				actions: [
					{
						label: this.__('common.yes'),
						isPrimary: true,
						callback: this.deleteSubmissionLocal,
					},
					{
						label: this.__('common.no'),
						isWarnable: true,
						callback: () => this.$modal.hide('deleteSubmission'),
					},
				],
			});
		},
	
			/**
			 * Send a request to delete the submission and handle the response
			 */
			deleteSubmissionLocal() {
				var self = this;
				let urlLocal = this.apiUrlLocal + '/' + this.item.id;
				$.ajax({
					url: urlLocal,
					type: 'POST',
					headers: {
						'X-Csrf-Token': pkp.currentUser.csrfToken,
						'X-Http-Method-Override': 'DELETE'
					},
					error: this.ajaxErrorCallback,
					success() {
						pkp.eventBus.$emit('deleted:submission', {id: self.item.id});
					},
					complete() {
						self.$modal.hide('deleteSubmission');
					}
				});
			},
		},
		render: function (h) {
			return listItemTemplate.render.call(this, h);
		},
	});
	