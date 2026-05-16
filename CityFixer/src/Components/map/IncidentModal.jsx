import React from 'react'
import { PlusCircle } from "lucide-react"
import { Button } from "../ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import IncidentForm from './IncidentForm'

const IncidentModal = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-md">
          <PlusCircle size={18} />
          Reportar Incidente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-800">
            Nuevo Reporte Urbano
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <IncidentForm />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default IncidentModal