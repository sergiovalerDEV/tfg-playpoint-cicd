import UserService from "../User/UserService"

const UsuarioGrupoService = {
  async buscarUsuarios(texto: string): Promise<any[]> {
    try {
      const api = await UserService.getAuthenticatedAxios()
      const response = await api.post("/usuario/buscar", { texto })
      return response.data
    } catch (error) {
      console.error("Error al buscar usuarios:", error)
      return []
    }
  },

  async anadirUsuarioGrupo(usuario: string, grupo: string): Promise<boolean> {
    try {
      const api = await UserService.getAuthenticatedAxios()
      await api.post("/usuariogrupo/anadir", { usuario, grupo })
      return true
    } catch (error) {
      console.error("Error al añadir usuario al grupo:", error)
      return false
    }
  },

  async eliminarUsuarioGrupo(usuario: string, grupo: string): Promise<boolean> {
    try {
      const api = await UserService.getAuthenticatedAxios()
      await api.post("/usuariogrupo/eliminar", { usuario, grupo })
      return true
    } catch (error) {
      console.error("Error al eliminar usuario del grupo:", error)
      return false
    }
  },
}

export default UsuarioGrupoService
