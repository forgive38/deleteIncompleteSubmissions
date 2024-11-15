<?php

/**
 * @file plugins/generic/deleteIncompleteSubmissions/deleteIncompleteSubmissions.php
 *
 * Copyright (c) 2024 Lepidus Tecnologia
 * Distributed under the GNU GPL v3. For full terms see LICENSE or https://www.gnu.org/licenses/gpl-3.0.txt
 *
 * @class DeleteIncompleteSubmissionsPlugin
 * @ingroup plugins_generic_deleteIncompleteSubmissions
 *
 */

namespace APP\plugins\generic\deleteIncompleteSubmissions;

use PKP\db\DAORegistry;
use PKP\plugins\GenericPlugin;
use PKP\plugins\Hook;

use PKP\linkAction\LinkAction;
use PKP\linkAction\request\AjaxModal;
use APP\core\Application;
use PKP\core\JSONMessage;
use APP\plugins\generic\deleteIncompleteSubmissions\settings\DeleteIncompleteSubmissionsSettingsForm;
use PKP\security\Role;
use PKP\template\PKPTemplateManager;


class DeleteIncompleteSubmissionsPlugin extends GenericPlugin
{
    /**
     * @copydoc Plugin::register()
     *
     * @param null|mixed $mainContextId
     */
    public function register($category, $path, $mainContextId = null)
    {
        $success = parent::register($category, $path, $mainContextId);
        if (Application::isUnderMaintenance()) {
            return $success;
        }
        if ($success && $this->getEnabled($mainContextId)) {
            Hook::add('TemplateManager::display', [$this, 'addIncompleteSubmissionsTab']);
        }
        return $success;
    }


    public function getDisplayName(): string
    {
        return __('plugins.generic.deleteIncompleteSubmissions.displayName');
    }

    public function getDescription(): string
    {
        return __('plugins.generic.deleteIncompleteSubmissions.description');
    }

    public function getCanEnable()
    {
        return ((bool) Application::get()->getRequest()->getContext());
    }

    public function getCanDisable()
    {
        return ((bool) Application::get()->getRequest()->getContext());
    }

    public function getActions($request, $actionArgs)
    {
        $router = $request->getRouter();
        return array_merge(
            $this->getEnabled() ? [
                new LinkAction(
                    'deletion',
                    new AjaxModal($router->url($request, null, null, 'manage', null, array('verb' => 'deletion', 'plugin' => $this->getName(), 'category' => 'generic')), $this->getDisplayName()),
                    __('plugins.generic.deleteIncompleteSubmissions.deletion'),
                )
            ] : [],
            parent::getActions($request, $actionArgs)
        );
    }

    public function manage($args, $request)
    {
        switch ($request->getUserVar('verb')) {
            case 'deletion':
                $context = $request->getContext();
                $form = new DeleteIncompleteSubmissionsSettingsForm($this, $context->getId());

                if ($request->getUserVar('save')) {
                    $form->readInputData();
                    if ($form->validate()) {
                        $form->execute();
                        return new JSONMessage(true);
                    }
                }

                return new JSONMessage(true, $form->fetch($request));
            default:
                return parent::manage($args, $request);
        }
    }

    public function addIncompleteSubmissionsTab($hookName, $params)
    {
        $templateMgr = $params[0];
        $template = $params[1];

        if ($template !== 'dashboard/index.tpl') {
            return false;
        }

        $userRoles = $templateMgr->getTemplateVars('userRoles');
        // only add incomplete submissions tab to super role
        if (! array_intersect([Role::ROLE_ID_SITE_ADMIN, Role::ROLE_ID_MANAGER], $userRoles)) {
            return false;
        }

        $request = Application::get()->getRequest();

        $currentUser = $request->getUser();
        $roleDao = DAORegistry::getDAO('RoleDAO'); /* @var $roleDao RoleDAO */

        $context = $request->getContext();
        // display incomplete Tab only for JM or Admin
        if (! (        $showIncompleteTab = $roleDao->userHasRole($context->getId(), $currentUser->getId(), Role::ROLE_ID_MANAGER) ||
			$roleDao->userHasRole($context->getId(), $currentUser->getId(), Role::ROLE_ID_SITE_ADMIN) ) ) {
                return false;
            }

        $dispatcher = $request->getDispatcher();
        $apiUrl = $dispatcher->url($request, Application::ROUTE_API, $context->getPath(), '_submissions');

        $componentsState = $templateMgr->getState('components');

        $includeAssignedEditorsFilter = array_intersect([Role::ROLE_ID_SITE_ADMIN, Role::ROLE_ID_MANAGER], $userRoles);
        $includeIssuesFilter = array_intersect(
            [Role::ROLE_ID_SITE_ADMIN, Role::ROLE_ID_MANAGER, Role::ROLE_ID_SUB_EDITOR, Role::ROLE_ID_ASSISTANT],
            $userRoles
        );

        $this->loadResources($request, $templateMgr);

        $incompleteListPanel = new \APP\components\listPanels\SubmissionsListPanel(
            'incompleteSubmissions',
            __('plugins.generic.deleteIncompleteSubmissions.incompleteSubmissionsTab'),
            [
                'apiUrl' => $apiUrl,
                'getParams' => [
                    'isIncomplete' => true,
                ],
                'lazyLoad' => true,
                'includeIssuesFilter' => $includeIssuesFilter,
                'includeAssignedEditorsFilter' => $includeAssignedEditorsFilter,
                'includeActiveSectionFiltersOnly' => true,
            ]
        );
        $componentsState[$incompleteListPanel->id] = $incompleteListPanel->getConfig();

        $templateMgr->setState(['components' => $componentsState]);


        $templateMgr->registerFilter("output", array($this, 'incompleteSubmissionsTabFilter'));

        return false;
    }

    public function incompleteSubmissionsTabFilter($output, $templateMgr)
    {
        if (preg_match('/<\/tab[^>]+>/', $output, $matches, PREG_OFFSET_CAPTURE)) {
            $match = $matches[0][0];
            $offset = $matches[0][1];

            $newOutput = substr($output, 0, $offset);
            $newOutput .= $templateMgr->fetch($this->getTemplateResource('incompleteSubmissionsTab.tpl'));
            $newOutput .= substr($output, $offset);
            $output = $newOutput;
            $templateMgr->unregisterFilter('output', array($this, 'incompleteSubmissionsTabFilter'));
        }
        return $output;
    }

    private function loadResources($request, $templateMgr)
    {
        $pluginFullPath = $request->getBaseUrl() . DIRECTORY_SEPARATOR . $this->getPluginPath();

        $templateMgr->addJavaScript(
            'incomplete-submissions-list-item',
            $pluginFullPath . '/js/components/IncompleteSubmissionsListItem.js',
            [
                'priority' => PKPTemplateManager::STYLE_SEQUENCE_LAST,
                'contexts' => ['backend']
            ]
        );
    }
}
