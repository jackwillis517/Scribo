import { createFileRoute } from '@tanstack/react-router'

const Document = () => {
  const { documentId } = Route.useParams()
  return <div>Document {documentId}</div>
}

export const Route = createFileRoute('/documents/$documentId')({
  component: Document,
})


