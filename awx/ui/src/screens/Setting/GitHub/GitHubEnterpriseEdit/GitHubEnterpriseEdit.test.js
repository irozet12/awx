import React from 'react';
import { act } from 'react-dom/test-utils';
import { createMemoryHistory } from 'history';
import { SettingsProvider } from 'contexts/Settings';
import { SettingsAPI } from 'api';
import {
  mountWithContexts,
  waitForElement,
} from '../../../../../testUtils/enzymeHelpers';
import mockAllOptions from '../../shared/data.allSettingOptions.json';
import GitHubEnterpriseEdit from './GitHubEnterpriseEdit';

jest.mock('../../../../api');

describe('<GitHubEnterpriseEdit />', () => {
  let wrapper;
  let history;

  beforeEach(() => {
    SettingsAPI.revertCategory.mockResolvedValue({});
    SettingsAPI.updateAll.mockResolvedValue({});
    SettingsAPI.readCategory.mockResolvedValue({
      data: {
        SOCIAL_AUTH_GITHUB_ENTERPRISE_CALLBACK_URL:
          'https://platformhost/sso/complete/github-enterprise/',
        SOCIAL_AUTH_GITHUB_ENTERPRISE_URL: '',
        SOCIAL_AUTH_GITHUB_ENTERPRISE_API_URL: '',
        SOCIAL_AUTH_GITHUB_ENTERPRISE_KEY: '',
        SOCIAL_AUTH_GITHUB_ENTERPRISE_SECRET: '$encrypted$',
        SOCIAL_AUTH_GITHUB_ENTERPRISE_ORGANIZATION_MAP: null,
        SOCIAL_AUTH_GITHUB_ENTERPRISE_TEAM_MAP: null,
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    history = createMemoryHistory({
      initialEntries: ['/settings/github/enterprise/edit'],
    });
    await act(async () => {
      wrapper = mountWithContexts(
        <SettingsProvider value={mockAllOptions.actions}>
          <GitHubEnterpriseEdit />
        </SettingsProvider>,
        {
          context: { router: { history } },
        }
      );
    });
    await waitForElement(wrapper, 'ContentLoading', (el) => el.length === 0);
  });

  test('initially renders without crashing', () => {
    expect(wrapper.find('GitHubEnterpriseEdit').length).toBe(1);
  });

  test('should display expected form fields', async () => {
    expect(
      wrapper.find('FormGroup[label="GitHub Enterprise URL"]').length
    ).toBe(1);
    expect(
      wrapper.find('FormGroup[label="GitHub Enterprise API URL"]').length
    ).toBe(1);
    expect(
      wrapper.find('FormGroup[label="GitHub Enterprise OAuth2 Key"]').length
    ).toBe(1);
    expect(
      wrapper.find('FormGroup[label="GitHub Enterprise OAuth2 Secret"]').length
    ).toBe(1);
    expect(
      wrapper.find(
        'FormGroup[label="GitHub Enterprise OAuth2 Organization Map"]'
      ).length
    ).toBe(1);
    expect(
      wrapper.find('FormGroup[label="GitHub Enterprise OAuth2 Team Map"]')
        .length
    ).toBe(1);
  });

  test('should successfully send default values to api on form revert all', async () => {
    expect(SettingsAPI.revertCategory).toHaveBeenCalledTimes(0);
    expect(wrapper.find('RevertAllAlert')).toHaveLength(0);
    await act(async () => {
      wrapper
        .find('button[aria-label="Revert all to default"]')
        .invoke('onClick')();
    });
    wrapper.update();
    expect(wrapper.find('RevertAllAlert')).toHaveLength(1);
    await act(async () => {
      wrapper
        .find('RevertAllAlert button[aria-label="Confirm revert all"]')
        .invoke('onClick')();
    });
    wrapper.update();
    expect(SettingsAPI.revertCategory).toHaveBeenCalledTimes(1);
    expect(SettingsAPI.revertCategory).toHaveBeenCalledWith(
      'github-enterprise'
    );
  });

  test('should successfully send request to api on form submission', async () => {
    act(() => {
      wrapper
        .find(
          'FormGroup[fieldId="SOCIAL_AUTH_GITHUB_ENTERPRISE_SECRET"] button[aria-label="Revert"]'
        )
        .invoke('onClick')();
      wrapper
        .find('input#SOCIAL_AUTH_GITHUB_ENTERPRISE_URL')
        .simulate('change', {
          target: {
            value: 'https://localhost',
            name: 'SOCIAL_AUTH_GITHUB_ENTERPRISE_URL',
          },
        });
      wrapper
        .find('CodeEditor#SOCIAL_AUTH_GITHUB_ENTERPRISE_ORGANIZATION_MAP')
        .invoke('onChange')('{\n"Default":{\n"users":\nfalse\n}\n}');
    });
    wrapper.update();
    await act(async () => {
      wrapper.find('Form').invoke('onSubmit')();
    });
    expect(SettingsAPI.updateAll).toHaveBeenCalledTimes(1);
    expect(SettingsAPI.updateAll).toHaveBeenCalledWith({
      SOCIAL_AUTH_GITHUB_ENTERPRISE_URL: 'https://localhost',
      SOCIAL_AUTH_GITHUB_ENTERPRISE_API_URL: '',
      SOCIAL_AUTH_GITHUB_ENTERPRISE_KEY: '',
      SOCIAL_AUTH_GITHUB_ENTERPRISE_SECRET: '',
      SOCIAL_AUTH_GITHUB_ENTERPRISE_TEAM_MAP: null,
      SOCIAL_AUTH_GITHUB_ENTERPRISE_ORGANIZATION_MAP: {
        Default: {
          users: false,
        },
      },
    });
  });

  test('should navigate to github enterprise detail on successful submission', async () => {
    await act(async () => {
      wrapper.find('Form').invoke('onSubmit')();
    });
    expect(history.location.pathname).toEqual(
      '/settings/github/enterprise/details'
    );
  });

  test('should navigate to github enterprise detail when cancel is clicked', async () => {
    await act(async () => {
      wrapper.find('button[aria-label="Cancel"]').invoke('onClick')();
    });
    expect(history.location.pathname).toEqual(
      '/settings/github/enterprise/details'
    );
  });

  test('should display error message on unsuccessful submission', async () => {
    const error = {
      response: {
        data: { detail: 'An error occurred' },
      },
    };
    SettingsAPI.updateAll.mockImplementation(() => Promise.reject(error));
    expect(wrapper.find('FormSubmitError').length).toBe(0);
    expect(SettingsAPI.updateAll).toHaveBeenCalledTimes(0);
    await act(async () => {
      wrapper.find('Form').invoke('onSubmit')();
    });
    wrapper.update();
    expect(wrapper.find('FormSubmitError').length).toBe(1);
    expect(SettingsAPI.updateAll).toHaveBeenCalledTimes(1);
  });

  test('should display ContentError on throw', async () => {
    SettingsAPI.readCategory.mockImplementationOnce(() =>
      Promise.reject(new Error())
    );
    await act(async () => {
      wrapper = mountWithContexts(
        <SettingsProvider value={mockAllOptions.actions}>
          <GitHubEnterpriseEdit />
        </SettingsProvider>
      );
    });
    await waitForElement(wrapper, 'ContentLoading', (el) => el.length === 0);
    expect(wrapper.find('ContentError').length).toBe(1);
  });
});
