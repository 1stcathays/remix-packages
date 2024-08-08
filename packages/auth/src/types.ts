export type AuthConfig = {
  clientId: string;
  clientSecret: string;
  scopes: string;

  authority: string;
  tokenURI: string;
  resourceURI: string;
  redirectURI: string;
};

type Term = {
  name: string;
  startdate: string;
  enddate: string;
  term_id: number;
};

type Section = {
  section_name: string;
  group_name: string;
  section_id: number;
  group_id: number;
  section_type: string;
  terms: Term[];
  upgrades: {
    level: string;
    badges: boolean;
    campsiteexternalbookings: boolean;
    details: boolean;
    events: boolean;
    emailbolton: boolean;
    programme: boolean;
    accounts: boolean;
    filestorage: boolean;
    chat: boolean;
    at_home: boolean;
  };
};

export type OsmUser = {
  data: {
    user_id: number;
    full_name: string;
    email: string;
    profile_picture_url: null | string;
    scopes: string[];
    sections: Section[];
    has_parent_access: boolean;
    has_section_access: boolean;
  };
};
