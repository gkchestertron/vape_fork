import apollo from '../lib/ApolloClient'
import gql from 'graphql-tag'
import Vue from 'vue'
import pageFiles from '../pages'

export default function (store) {
  return apollo().query({
    query: gql`{
      allPages {
        edges {
          node {
            id
            parentId
            route
            title
            template
            data
          }
        }
      }
    }`
  })
  .then(result => {
    try {
      let pages = result.data.allPages.edges.map(edge => {
        let page = edge.node
        let data = {}

        try {
          data = JSON.parse(page.data)
        } catch (e) {
          console.error(e)
          data = {}
        }

        return Object.assign({}, page, { data })
      })

      return pages.map(page => {
        let route = getRoute(page, pages)
        let pageFile = Object.values(pageFiles).find(pF => pF.name === page.route)

        page.data.route = route
        page.data.children = pages.filter(p => p.parentId === page.id)
        page.path = route

        store.commit('SET_PAGE', { page })

        pageFile.data = x => store.state.pages[page.id].data

        return { 
          path: route,
          component: pageFile,
        }
      })
    } catch (e) {
      console.error(e)
      return []
    }
  })
}

function getRoute(page, pages) {
  if (!page.parentId)
    return `/${page.route}`

  let parentPage = pages.find(p => p.id === page.parentId)

  return `${getRoute(parentPage, pages)}/${page.route}`
}
