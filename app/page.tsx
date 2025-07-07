"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, CalendarIcon, Clock, Plus, Settings, Trash2, Edit, Download, Crown } from "lucide-react"
import { format, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns"
import { fr } from "date-fns/locale"

interface Event {
  id: string
  title: string
  description: string
  date: Date
  time: string
  category: "work" | "personal" | "health" | "other"
  notification: boolean
  notificationTime: number // minutes before
}

interface NotificationSettings {
  enabled: boolean
  defaultTime: number
}

export default function ProductivityApp() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    enabled: false,
    defaultTime: 15,
  })

  const [isPremium, setIsPremium] = useState(false)
  const [premiumCode, setPremiumCode] = useState("")
  const [showPremiumDialog, setShowPremiumDialog] = useState(false)

  // Nouveaux états pour les comptes
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ username: string; email: string } | null>(null)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [showRegisterDialog, setShowRegisterDialog] = useState(false)
  const [showAccountDialog, setShowAccountDialog] = useState(false)
  const [loginForm, setLoginForm] = useState({ username: "", password: "" })
  const [registerForm, setRegisterForm] = useState({ username: "", email: "", password: "" })

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    time: "",
    category: "personal" as Event["category"],
    notification: true,
    notificationTime: 15,
  })

  const [currentView, setCurrentView] = useState("month")

  useEffect(() => {
    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }

    // Load events from localStorage
    const savedEvents = localStorage.getItem("productivity-events")
    if (savedEvents) {
      const parsedEvents = JSON.parse(savedEvents).map((event: any) => ({
        ...event,
        date: new Date(event.date),
      }))
      setEvents(parsedEvents)
    }

    // Load notification settings
    const savedSettings = localStorage.getItem("notification-settings")
    if (savedSettings) {
      setNotificationSettings(JSON.parse(savedSettings))
    }
  }, [])

  useEffect(() => {
    const savedPremiumStatus = localStorage.getItem("premium-status")
    if (savedPremiumStatus === "true") {
      setIsPremium(true)
    }

    // Charger l'utilisateur connecté
    const savedUser = localStorage.getItem("current-user")
    if (savedUser) {
      const user = JSON.parse(savedUser)
      setIsLoggedIn(true)
      setCurrentUser(user)

      // Charger le statut premium de l'utilisateur
      const userPremiumStatus = localStorage.getItem(`premium-${user.username}`)
      if (userPremiumStatus === "true") {
        setIsPremium(true)
      }
    }
  }, [])

  useEffect(() => {
    // Save events to localStorage
    localStorage.setItem("productivity-events", JSON.stringify(events))
  }, [events])

  useEffect(() => {
    // Save notification settings
    localStorage.setItem("notification-settings", JSON.stringify(notificationSettings))
  }, [notificationSettings])

  const scheduleNotification = (event: Event) => {
    if (!notificationSettings.enabled || !event.notification) return

    const eventDateTime = new Date(event.date)
    const [hours, minutes] = event.time.split(":").map(Number)
    eventDateTime.setHours(hours, minutes)

    const notificationTime = new Date(eventDateTime.getTime() - event.notificationTime * 60000)
    const now = new Date()

    if (notificationTime > now) {
      const timeUntilNotification = notificationTime.getTime() - now.getTime()

      setTimeout(() => {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(`Rappel: ${event.title}`, {
            body: `Dans ${event.notificationTime} minutes - ${event.description}`,
            icon: "/favicon.ico",
            tag: event.id,
          })
        }
      }, timeUntilNotification)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newEvent: Event = {
      id: editingEvent?.id || Date.now().toString(),
      title: formData.title,
      description: formData.description,
      date: selectedDate,
      time: formData.time,
      category: formData.category,
      notification: formData.notification,
      notificationTime: formData.notificationTime,
    }

    if (editingEvent) {
      setEvents(events.map((event) => (event.id === editingEvent.id ? newEvent : event)))
    } else {
      setEvents([...events, newEvent])
    }

    // Schedule notification
    scheduleNotification(newEvent)

    // Reset form
    setFormData({
      title: "",
      description: "",
      time: "",
      category: "personal",
      notification: true,
      notificationTime: 15,
    })
    setEditingEvent(null)
    setIsDialogOpen(false)
  }

  const deleteEvent = (eventId: string) => {
    setEvents(events.filter((event) => event.id !== eventId))
  }

  const editEvent = (event: Event) => {
    setEditingEvent(event)
    setFormData({
      title: event.title,
      description: event.description,
      time: event.time,
      category: event.category,
      notification: event.notification,
      notificationTime: event.notificationTime,
    })
    setIsDialogOpen(true)
  }

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => isSameDay(event.date, date))
  }

  const getCategoryColor = (category: Event["category"]) => {
    const colors = {
      work: "bg-blue-500",
      personal: "bg-green-500",
      health: "bg-red-500",
      other: "bg-purple-500",
    }
    return colors[category]
  }

  const getCategoryLabel = (category: Event["category"]) => {
    const labels = {
      work: "Travail",
      personal: "Personnel",
      health: "Santé",
      other: "Autre",
    }
    return labels[category]
  }

  const getWeekDays = () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 })
    const end = endOfWeek(selectedDate, { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }

  const enableNotifications = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission()
      if (permission === "granted") {
        setNotificationSettings((prev) => ({ ...prev, enabled: true }))
      }
    }
  }

  // Nouvelles fonctions pour les comptes
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Simulation de connexion - en réalité, vous feriez un appel API
    const users = JSON.parse(localStorage.getItem("users") || "[]")
    const user = users.find((u: any) => u.username === loginForm.username && u.password === loginForm.password)

    if (user) {
      setIsLoggedIn(true)
      setCurrentUser({ username: user.username, email: user.email })
      setShowLoginDialog(false)
      setLoginForm({ username: "", password: "" })
      localStorage.setItem("current-user", JSON.stringify({ username: user.username, email: user.email }))

      // Charger le statut premium de l'utilisateur
      const userPremiumStatus = localStorage.getItem(`premium-${user.username}`)
      if (userPremiumStatus === "true") {
        setIsPremium(true)
      }
    } else {
      alert("Nom d'utilisateur ou mot de passe incorrect")
    }
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    const users = JSON.parse(localStorage.getItem("users") || "[]")

    // Vérifier si l'utilisateur existe déjà
    if (users.find((u: any) => u.username === registerForm.username)) {
      alert("Ce nom d'utilisateur existe déjà")
      return
    }

    // Ajouter le nouvel utilisateur
    const newUser = {
      username: registerForm.username,
      email: registerForm.email,
      password: registerForm.password,
    }
    users.push(newUser)
    localStorage.setItem("users", JSON.stringify(users))

    // Connexion automatique
    setIsLoggedIn(true)
    setCurrentUser({ username: newUser.username, email: newUser.email })
    setShowRegisterDialog(false)
    setRegisterForm({ username: "", email: "", password: "" })
    localStorage.setItem("current-user", JSON.stringify({ username: newUser.username, email: newUser.email }))
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setCurrentUser(null)
    setIsPremium(false)
    setShowAccountDialog(false)
    localStorage.removeItem("current-user")
    localStorage.removeItem("premium-status")
  }

  const cancelPremium = () => {
    const confirmed = window.confirm(
      "Êtes-vous sûr de vouloir annuler votre abonnement Premium ? Vous perdrez l'accès aux fonctionnalités exclusives.",
    )

    if (confirmed) {
      setIsPremium(false)
      if (currentUser) {
        localStorage.removeItem(`premium-${currentUser.username}`)
      }
      localStorage.removeItem("premium-status")
      alert("Abonnement Premium annulé.")
    }
  }

  const handlePremiumSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Vérifier si l'utilisateur est connecté
    if (!isLoggedIn || !currentUser) {
      alert("Vous devez être connecté pour activer Premium !")
      setShowPremiumDialog(false)
      return
    }

    if (premiumCode.toLowerCase() === "bonjour") {
      setIsPremium(true)
      setShowPremiumDialog(false)
      setPremiumCode("")
      localStorage.setItem("premium-status", "true")

      // Associer le premium à l'utilisateur connecté
      if (currentUser) {
        localStorage.setItem(`premium-${currentUser.username}`, "true")
      }

      alert("Premium activé avec succès !")
    } else {
      alert("Code incorrect !")
    }
  }

  return (
    <div
      className={`min-h-screen p-4 ${isPremium ? "bg-gradient-to-br from-yellow-50 to-yellow-100" : "bg-gradient-to-br from-blue-50 to-indigo-100"}`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Mon Espace Productivité</h1>
              <p className="text-gray-600">Organisez votre temps et restez productif</p>
            </div>
            <div className="flex items-center gap-4">
              {!isLoggedIn ? (
                <>
                  <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline">Se connecter</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Connexion</DialogTitle>
                        <DialogDescription>Connectez-vous à votre compte</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                          <Label htmlFor="login-username">Nom d'utilisateur</Label>
                          <Input
                            id="login-username"
                            value={loginForm.username}
                            onChange={(e) => setLoginForm((prev) => ({ ...prev, username: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="login-password">Mot de passe</Label>
                          <Input
                            id="login-password"
                            type="password"
                            value={loginForm.password}
                            onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                            required
                          />
                        </div>
                        <DialogFooter>
                          <Button type="submit">Se connecter</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
                    <DialogTrigger asChild>
                      <Button>S'inscrire</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Inscription</DialogTitle>
                        <DialogDescription>Créez votre compte</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleRegister} className="space-y-4">
                        <div>
                          <Label htmlFor="register-username">Nom d'utilisateur</Label>
                          <Input
                            id="register-username"
                            value={registerForm.username}
                            onChange={(e) => setRegisterForm((prev) => ({ ...prev, username: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="register-email">Email</Label>
                          <Input
                            id="register-email"
                            type="email"
                            value={registerForm.email}
                            onChange={(e) => setRegisterForm((prev) => ({ ...prev, email: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="register-password">Mot de passe</Label>
                          <Input
                            id="register-password"
                            type="password"
                            value={registerForm.password}
                            onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))}
                            required
                          />
                        </div>
                        <DialogFooter>
                          <Button type="submit">S'inscrire</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </>
              ) : (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">Bonjour, {currentUser?.username}</span>
                  {isPremium && <Badge className="bg-yellow-500 text-white">Premium</Badge>}
                  <Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Mon compte
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Mon compte</DialogTitle>
                        <DialogDescription>Gérez votre compte et vos paramètres</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Nom d'utilisateur</Label>
                          <p className="text-sm text-gray-600">{currentUser?.username}</p>
                        </div>
                        <div>
                          <Label>Email</Label>
                          <p className="text-sm text-gray-600">{currentUser?.email}</p>
                        </div>
                        <div>
                          <Label>Statut</Label>
                          <p className="text-sm text-gray-600">
                            {isPremium ? "Utilisateur Premium" : "Utilisateur Standard"}
                          </p>
                        </div>
                        {isPremium && (
                          <div className="border-t pt-4">
                            <h4 className="font-medium mb-2">Gestion Premium</h4>
                            <Button variant="destructive" size="sm" onClick={cancelPremium} className="w-full">
                              Annuler l'abonnement Premium
                            </Button>
                            <p className="text-xs text-gray-500 mt-2">
                              Vous perdrez l'accès aux fonctionnalités premium
                            </p>
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={handleLogout}>
                          Se déconnecter
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Calendrier
                  </CardTitle>
                  <div className="flex gap-2">
                    <Tabs value={currentView} onValueChange={(value) => setCurrentView(value)}>
                      <TabsList>
                        <TabsTrigger value="month">Mois</TabsTrigger>
                        <TabsTrigger value="week">Semaine</TabsTrigger>
                        <TabsTrigger value="day">Jour</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {currentView === "month" && (
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    locale={fr}
                    className="rounded-md border"
                    components={{
                      Day: ({ date, ...props }) => {
                        const dayEvents = getEventsForDate(date)
                        return (
                          <div className="relative">
                            <button {...props} className={`${props.className} relative`}>
                              {format(date, "d")}
                              {dayEvents.length > 0 && (
                                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                </div>
                              )}
                            </button>
                          </div>
                        )
                      },
                    }}
                  />
                )}

                {currentView === "week" && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-center">
                      Semaine du {format(startOfWeek(selectedDate, { weekStartsOn: 1 }), "dd MMM", { locale: fr })}
                    </h3>
                    <div className="grid grid-cols-7 gap-2">
                      {getWeekDays().map((day) => (
                        <div key={day.toISOString()} className="border rounded p-2 min-h-[100px]">
                          <div className="font-medium text-sm mb-2">{format(day, "EEE dd", { locale: fr })}</div>
                          {getEventsForDate(day).map((event) => (
                            <div key={event.id} className="text-xs p-1 bg-blue-100 rounded mb-1">
                              {event.time} - {event.title}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentView === "day" && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-center">
                      {format(selectedDate, "EEEE dd MMMM yyyy", { locale: fr })}
                    </h3>
                    <div className="space-y-2">
                      {getEventsForDate(selectedDate).length === 0 ? (
                        <p className="text-gray-500 text-center py-8">Aucun événement pour cette journée</p>
                      ) : (
                        getEventsForDate(selectedDate)
                          .sort((a, b) => a.time.localeCompare(b.time))
                          .map((event) => (
                            <div key={event.id} className="border rounded p-3 bg-white">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-3 h-3 rounded-full ${getCategoryColor(event.category)}`}></div>
                                  <div>
                                    <h4 className="font-medium">{event.title}</h4>
                                    <p className="text-sm text-gray-600">
                                      {event.time} - {event.description}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" onClick={() => editEvent(event)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => deleteEvent(event.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Downloads Section */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Ressources à télécharger
                  {!isPremium && <Crown className="h-4 w-4 text-yellow-500 ml-2" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Download Item 1 */}
                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="aspect-video bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg mb-3 flex items-center justify-center">
                      <img
                        src="/placeholder.svg?height=120&width=200"
                        alt="Guide de productivité"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <h3 className="font-semibold mb-2">Guide de Productivité Premium</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Un guide complet exclusif pour optimiser votre temps et améliorer votre efficacité au quotidien.
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        className={`flex-1 ${isPremium ? "bg-yellow-500 hover:bg-yellow-600 text-white" : "bg-transparent"}`}
                        variant={isPremium ? "default" : "outline"}
                        onClick={() => {
                          if (!isPremium) {
                            alert("Vous devez avoir un abonnement Premium pour télécharger cette ressource !")
                          } else {
                            // Logique de téléchargement ici
                            alert("Téléchargement en cours...")
                          }
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger
                      </Button>
                      <Crown className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                    </div>
                  </div>

                  {/* Download Item 2 */}
                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="aspect-video bg-gradient-to-br from-green-100 to-green-200 rounded-lg mb-3 flex items-center justify-center">
                      <img
                        src="/placeholder.svg?height=120&width=200"
                        alt="Template de planning"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <h3 className="font-semibold mb-2">Template de Planning VIP</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Modèles de planification avancés hebdomadaires et mensuels pour organiser vos projets
                      efficacement.
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        className={`flex-1 ${isPremium ? "bg-yellow-500 hover:bg-yellow-600 text-white" : "bg-transparent"}`}
                        variant={isPremium ? "default" : "outline"}
                        onClick={() => {
                          if (!isPremium) {
                            alert("Vous devez avoir un abonnement Premium pour télécharger cette ressource !")
                          } else {
                            // Logique de téléchargement ici
                            alert("Téléchargement en cours...")
                          }
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger
                      </Button>
                      <Crown className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                    </div>
                  </div>

                  {/* Download Item 3 */}
                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="aspect-video bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg mb-3 flex items-center justify-center">
                      <img
                        src="/placeholder.svg?height=120&width=200"
                        alt="Checklist quotidienne"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <h3 className="font-semibold mb-2">Checklist Quotidienne Pro</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Liste de vérification premium personnalisable pour suivre vos habitudes et tâches quotidiennes.
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        className={`flex-1 ${isPremium ? "bg-yellow-500 hover:bg-yellow-600 text-white" : "bg-transparent"}`}
                        variant={isPremium ? "default" : "outline"}
                        onClick={() => {
                          if (!isPremium) {
                            alert("Vous devez avoir un abonnement Premium pour télécharger cette ressource !")
                          } else {
                            // Logique de téléchargement ici
                            alert("Téléchargement en cours...")
                          }
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger
                      </Button>
                      <Crown className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Add Event */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Ajouter un événement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">Nouvel événement</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingEvent ? "Modifier l'événement" : "Nouvel événement"}</DialogTitle>
                      <DialogDescription>
                        Planifiez votre événement pour le {format(selectedDate, "dd MMMM yyyy", { locale: fr })}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="title">Titre</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="time">Heure</Label>
                        <Input
                          id="time"
                          type="time"
                          value={formData.time}
                          onChange={(e) => setFormData((prev) => ({ ...prev, time: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Catégorie</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) =>
                            setFormData((prev) => ({ ...prev, category: value as Event["category"] }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="work">Travail</SelectItem>
                            <SelectItem value="personal">Personnel</SelectItem>
                            <SelectItem value="health">Santé</SelectItem>
                            <SelectItem value="other">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="notification"
                          checked={formData.notification}
                          onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, notification: checked }))}
                        />
                        <Label htmlFor="notification">Notification</Label>
                      </div>
                      {formData.notification && (
                        <div>
                          <Label htmlFor="notificationTime">Rappel (minutes avant)</Label>
                          <Select
                            value={formData.notificationTime.toString()}
                            onValueChange={(value) =>
                              setFormData((prev) => ({ ...prev, notificationTime: Number.parseInt(value) }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5 minutes</SelectItem>
                              <SelectItem value="15">15 minutes</SelectItem>
                              <SelectItem value="30">30 minutes</SelectItem>
                              <SelectItem value="60">1 heure</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <DialogFooter>
                        <Button type="submit">{editingEvent ? "Modifier" : "Ajouter"}</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Today's Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Aujourd'hui
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getEventsForDate(new Date()).length === 0 ? (
                    <p className="text-gray-500 text-sm">Aucun événement aujourd'hui</p>
                  ) : (
                    getEventsForDate(new Date())
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map((event) => (
                        <div key={event.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                          <div className={`w-2 h-2 rounded-full ${getCategoryColor(event.category)}`}></div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{event.title}</p>
                            <p className="text-xs text-gray-600">{event.time}</p>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {getCategoryLabel(event.category)}
                          </Badge>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notifications-enabled">Activer les notifications</Label>
                    <Switch
                      id="notifications-enabled"
                      checked={notificationSettings.enabled}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          enableNotifications()
                        } else {
                          setNotificationSettings((prev) => ({ ...prev, enabled: false }))
                        }
                      }}
                    />
                  </div>
                  {!notificationSettings.enabled && (
                    <Button onClick={enableNotifications} variant="outline" size="sm" className="w-full bg-transparent">
                      Autoriser les notifications
                    </Button>
                  )}
                  <div>
                    <Label htmlFor="default-time">Rappel par défaut</Label>
                    <Select
                      value={notificationSettings.defaultTime.toString()}
                      onValueChange={(value) =>
                        setNotificationSettings((prev) => ({ ...prev, defaultTime: Number.parseInt(value) }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 minutes</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 heure</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Statistiques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total événements</span>
                    <Badge>{events.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Aujourd'hui</span>
                    <Badge>{getEventsForDate(new Date()).length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Cette semaine</span>
                    <Badge>{getWeekDays().reduce((count, day) => count + getEventsForDate(day).length, 0)}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Premium Section */}
        {isLoggedIn ? (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Fonctionnalités Premium
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isPremium ? (
                <div className="text-center space-y-4">
                  <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 p-6 rounded-lg">
                    <Crown className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Passez au Premium</h3>
                    <p className="text-gray-600 mb-4">
                      Débloquez des fonctionnalités exclusives et personnalisez votre expérience
                    </p>
                    <ul className="text-sm text-gray-700 space-y-2 mb-4">
                      <li>• Thème doré exclusif</li>
                      <li>• Synchronisation cloud</li>
                      <li>• Rappels par email</li>
                      <li>• Support prioritaire</li>
                    </ul>
                    <Dialog open={showPremiumDialog} onOpenChange={setShowPremiumDialog}>
                      <DialogTrigger asChild>
                        <Button className="bg-yellow-500 hover:bg-yellow-600 text-white">
                          <Crown className="h-4 w-4 mr-2" />
                          Activer Premium
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Crown className="h-5 w-5 text-yellow-500" />
                            Activation Premium
                          </DialogTitle>
                          <DialogDescription>
                            Entrez votre code d'activation pour débloquer les fonctionnalités premium
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handlePremiumSubmit} className="space-y-4">
                          <div>
                            <Label htmlFor="premium-code">Code d'activation</Label>
                            <Input
                              id="premium-code"
                              type="text"
                              value={premiumCode}
                              onChange={(e) => setPremiumCode(e.target.value)}
                              placeholder="Entrez votre code..."
                              required
                            />
                            <p className="text-xs text-gray-500 mt-1">Vous devez être connecté pour activer Premium</p>
                          </div>
                          <DialogFooter>
                            <Button type="submit" className="bg-yellow-500 hover:bg-yellow-600">
                              Activer
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 p-6 rounded-lg">
                    <Crown className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2 text-yellow-800">Premium Activé !</h3>
                    <p className="text-yellow-700 mb-4">Profitez de toutes les fonctionnalités exclusives</p>
                    <Badge className="bg-yellow-500 text-white">Utilisateur Premium</Badge>
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelPremium}
                        className="text-red-600 border-red-300 hover:bg-red-50 bg-transparent"
                      >
                        Annuler Premium
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Fonctionnalités Premium
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-6 rounded-lg">
                  <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2 text-gray-600">Premium Disponible</h3>
                  <p className="text-gray-500 mb-4">Connectez-vous pour accéder aux fonctionnalités Premium</p>
                  <Button variant="outline" onClick={() => setShowLoginDialog(true)} className="bg-transparent">
                    Se connecter pour Premium
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
