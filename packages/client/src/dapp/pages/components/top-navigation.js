import { LitElement, html, customElement, property } from "lit-element";
@customElement('top-navigation')
export default class TopNavigation extends LitElement {
  @property()
  collapse;
  
  createRenderRoot() {
    return this;
  }

  constructor(args) {
    super(args);
    setTimeout(() => {
      this.setPageLoader();
    }, 0);
  }

  getPages() {
    let staticPages = [
      {
        name: "dapp",
        title: "My Dapp",
        route: "/"
      }
    ];
    return staticPages.concat([{"name":"administrator_role","title":"Administrator Role","description":"Define accounts that can perform certain admin functions.","category":"Access Control","route":"/administrator_role"},{"name":"contract_access","title":"Contract Access","description":"Control which external contracts can interact with your contract.","category":"Access Control","route":"/contract_access"},{"name":"contract_runstate","title":"Contract Run State","description":"Ability to pause operation of your smart contract.","category":"Access Control","route":"/contract_runstate"},{"name":"token","title":"Custom Token","description":"Create a token for tracking value associated with your dapp.","category":"Asset and Value Tracking","route":"/token"},{"name":"ipfs","title":"IPFS Documents","description":"InterPlanetary File System (decentralized file storage)","category":"File Storage","route":"/ipfs"}]); 
  }

  navigate = name => {
    let contentPages = this.getPages();
    let pageItem = contentPages.find(item => item.name === name);
    if (!pageItem) {
      return;
    }

    window.history.pushState(null, pageItem.title, pageItem.route);
    this.setPageLoader(pageItem);
  };

  handleClick = e => {
    e.preventDefault();
    this.navigate(e.target.dataset.link);
    this.requestUpdate();
  };

  setPageLoader(pageItem) {
    let pages = this.getPages();
    if (pageItem == null) {
      let pageName = location.href.split("/").pop();
      if (pageName !== "") {
        pageItem = pages.find(x => x.name == pageName);
      } else {
        pageItem = pages[0];
      }
    }

    let pageLoader = document.getElementById("page-loader");
    pageLoader.load(pageItem);
  }
  
  render() {
    this.classList.add('z-10', 'fixed');
    let content = html`
      <nav
        x-data="{ open: false }"
        @keydown.window.escape="open = false"
        class="bg-white fixed w-full shadow"
      >
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-center h-10">
            <div class="flex items-center">
              <div class="hidden md:block">
                <div class="ml-10 flex items-baseline">
                ${this.getPages().map(x => {
                  return html`
                    <a
                      href="#"
                      class="ml-4 px-3 py-2 rounded-md text-sm font-medium hover:text-white hover:bg-gray-700 focus:outline-none focus:text-white focus:bg-gray-700 ${document.location.href.endsWith(
                        x.route
                      )
                        ? "bg-gray-700 text-white"
                        : "text-gray-500"}"
                      @click=${this.handleClick}
                      data-link="${x.name}"
                      >${x.title}</a
                    >
                  `;
                })}
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </nav>
    `;
    return content;
  }
}



